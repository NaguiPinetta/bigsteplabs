<script lang="ts">
  import { onMount } from "svelte";
  import { authStore } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";
  import {
    userModuleAccessStore,
    loadUserModuleAccess,
  } from "$lib/stores/user-module-access";
  import { get } from "svelte/store";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    BookOpen,
    Play,
    Award,
    Clock,
    TrendingUp,
    MessageSquare,
    CheckCircle,
    Circle,
    ArrowRight,
    BarChart3,
    Calendar,
    Loader2,
    AlertCircle,
    Target,
    Zap,
  } from "lucide-svelte";

  let loading = true;
  let error = "";

  let progressData = {
    totalModules: 0,
    completedModules: 0,
    totalUnits: 0,
    completedUnits: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    totalSessions: 0,
  };

  let nextLessons: any[] = [];
  let recentActivity: any[] = [];
  let achievements: any[] = [];
  let weeklyProgress: any[] = [];

  $: user = $authStore.user;
  $: completionRate =
    progressData.totalUnits > 0
      ? Math.round(
          (progressData.completedUnits / progressData.totalUnits) * 100
        )
      : 0;

  onMount(async () => {
    if (user) {
      await loadUserModuleAccess();
      await loadStudentData();
    }
  });

  async function loadStudentData() {
    loading = true;
    error = "";

    try {
      await Promise.all([
        loadProgressData(),
        loadNextLessons(),
        loadRecentActivity(),
        loadAchievements(),
        loadWeeklyProgress(),
      ]);
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      console.error("Dashboard error:", err);
    } finally {
      loading = false;
    }
  }

  async function loadProgressData() {
    if (!user) return;

    // Get user progress summary
    const { data: progress } = await supabase
      .from("user_progress")
      .select(
        `
				*,
				unit:units(
					*,
					module:modules(*)
				)
			`
      )
      .eq("user_id", user.id);

    // Calculate progress statistics
    const modules = new Set();
    const units = new Set();
    const completedUnits = new Set();
    let totalTime = 0;

    progress?.forEach((p) => {
      if (p.unit?.module) {
        modules.add(p.unit.module.id);
      }
      units.add(p.unit_id);

      if (p.status === "done") {
        completedUnits.add(p.unit_id);
      }

      totalTime += p.time_spent_minutes || 0;
    });

    // Get user's accessible modules
    const userAccess = get(userModuleAccessStore);
    const accessibleModuleIds = userAccess.assignedModuleIds;

    // Get total modules and units (only accessible ones for students)
    let totalModulesCount = 0;
    let totalUnitsCount = 0;

    if (accessibleModuleIds.length > 0) {
      const { count: modulesCount } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .in("id", accessibleModuleIds);

      const { count: unitsCount } = await supabase
        .from("units")
        .select("*, module:modules!inner(*)", { count: "exact", head: true })
        .eq("modules.is_published", true)
        .in("modules.id", accessibleModuleIds);

      totalModulesCount = modulesCount || 0;
      totalUnitsCount = unitsCount || 0;
    }

    // Get chat sessions count
    const { count: sessionsCount } = await supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    progressData = {
      totalModules: totalModulesCount || 0,
      completedModules: modules.size,
      totalUnits: totalUnitsCount || 0,
      completedUnits: completedUnits.size,
      totalTimeSpent: totalTime,
      currentStreak: calculateStreak(progress || []),
      totalSessions: sessionsCount || 0,
    };
  }

  async function loadNextLessons() {
    if (!user) return;

    // Get user's current progress
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("unit_id, status")
      .eq("user_id", user.id);

    const completedUnitIds =
      userProgress?.filter((p) => p.status === "done").map((p) => p.unit_id) ||
      [];
    const inProgressUnitIds =
      userProgress
        ?.filter((p) => p.status === "in_progress")
        .map((p) => p.unit_id) || [];

    // Get user's accessible modules
    const userAccess = get(userModuleAccessStore);
    const accessibleModuleIds = userAccess.assignedModuleIds;

    // Get next recommended units (only from accessible modules)
    let units = [];
    if (accessibleModuleIds.length > 0) {
      const { data: unitsData } = await supabase
        .from("units")
        .select(
          `
					*,
					module:modules!inner(*),
					content:content(id, title, content_type)
				`
        )
        .eq("modules.is_published", true)
        .in("modules.id", accessibleModuleIds)
        .order("order_index")
        .limit(5);

      units = unitsData || [];
    }

    // Filter and prioritize units
    const nextUnits =
      units
        ?.filter((unit) => {
          return !completedUnitIds.includes(unit.id);
        })
        .slice(0, 3) || [];

    nextLessons = nextUnits.map((unit) => ({
      ...unit,
      isInProgress: inProgressUnitIds.includes(unit.id),
      contentCount: unit.content?.length || 0,
    }));
  }

  async function loadRecentActivity() {
    if (!user) return;

    // Get recent user progress updates
    const { data: progress } = await supabase
      .from("user_progress")
      .select(
        `
				*,
				unit:units(
					*,
					module:modules(title)
				)
			`
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    // Get recent chat sessions
    const { data: chats } = await supabase
      .from("chat_sessions")
      .select(
        `
				*,
				agent:agents(
					name,
					persona:personas(name)
				)
			`
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(3);

    // Combine and sort by date
    const activities = [
      ...(progress?.map((p) => ({
        type: "lesson",
        title: `${p.status === "done" ? "Completed" : "Started"} ${p.unit?.title}`,
        subtitle: p.unit?.module?.title,
        time: p.updated_at,
        status: p.status,
        icon: p.status === "done" ? CheckCircle : Play,
      })) || []),
      ...(chats?.map((c) => ({
        type: "chat",
        title: `Chat with ${c.agent?.name}`,
        subtitle: c.agent?.persona?.name,
        time: c.updated_at,
        status: c.status,
        icon: MessageSquare,
      })) || []),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    recentActivity = activities;
  }

  async function loadAchievements() {
    // Mock achievements based on progress
    const achievements = [];

    if (progressData.completedUnits >= 5) {
      achievements.push({
        title: "Quick Learner",
        description: "Completed 5 lessons",
        icon: "🚀",
        earned: true,
      });
    }

    if (progressData.totalTimeSpent >= 60) {
      achievements.push({
        title: "Dedicated Student",
        description: "Spent 1+ hour learning",
        icon: "⏰",
        earned: true,
      });
    }

    if (progressData.currentStreak >= 3) {
      achievements.push({
        title: "Consistent Learner",
        description: "3+ day learning streak",
        icon: "🔥",
        earned: true,
      });
    }

    if (progressData.totalSessions >= 5) {
      achievements.push({
        title: "AI Conversationalist",
        description: "5+ chat sessions",
        icon: "💬",
        earned: true,
      });
    }

    // Add some unearned achievements
    if (progressData.completedModules === 0) {
      achievements.push({
        title: "Module Master",
        description: "Complete your first module",
        icon: "🏆",
        earned: false,
      });
    }

    if (progressData.currentStreak < 7) {
      achievements.push({
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: "⚡",
        earned: false,
      });
    }

    return achievements;
  }

  async function loadWeeklyProgress() {
    if (!user) return;

    // Get progress for the last 7 days
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const { data: dayProgress } = await supabase
        .from("user_progress")
        .select("time_spent_minutes")
        .eq("user_id", user.id)
        .gte("updated_at", date.toISOString().split("T")[0])
        .lt(
          "updated_at",
          new Date(date.getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        );

      const totalMinutes =
        dayProgress?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) ||
        0;

      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        minutes: totalMinutes,
        active: totalMinutes > 0,
      });
    }

    weeklyProgress = days;
  }

  function calculateStreak(progress: any[]): number {
    // Simple streak calculation - count consecutive days with activity
    // This is a simplified version - you might want more sophisticated logic
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasActivity = progress.some((p) => {
        const progressDate = new Date(p.updated_at);
        return progressDate.toDateString() === checkDate.toDateString();
      });

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        // Don't break streak on today if there's no activity yet
        break;
      }
    }

    return streak;
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  async function startLesson(unit: any) {
    // Navigate to the lesson or update progress
    window.location.href = `/student/learn/${unit.module.slug}/${unit.slug}`;
  }
</script>

<svelte:head>
  <title>Student Dashboard - BigStepLabs</title>
  <meta
    name="description"
    content="Track your learning progress and continue your studies"
  />
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
  <h1 class="text-2xl font-bold text-foreground mb-2">
    Welcome back, {user?.full_name || user?.email?.split("@")[0] || "Student"}!
  </h1>
  <p class="text-muted-foreground">
    Ready to continue your learning journey? Let's see what's next.
  </p>
</div>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <Loader2 class="w-8 h-8 animate-spin text-primary" />
    <span class="ml-2 text-muted-foreground">Loading your dashboard...</span>
  </div>
{:else if error}
  <Card class="p-6 border-destructive">
    <div class="flex items-center">
      <AlertCircle class="w-5 h-5 text-destructive mr-2" />
      <span class="text-destructive font-medium">Error: {error}</span>
    </div>
  </Card>
{:else}
  <div class="space-y-8">
    <!-- Progress Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <BookOpen class="w-8 h-8 text-primary" />
          <span class="text-2xl font-bold text-foreground"
            >{completionRate}%</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Progress</h3>
        <p class="text-sm text-muted-foreground">
          {progressData.completedUnits} of {progressData.totalUnits} lessons completed
        </p>
        <div class="mt-3 w-full bg-secondary rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all duration-300"
            style={`width: ${completionRate}%`}
          ></div>
        </div>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <Clock class="w-8 h-8 text-blue-500" />
          <span class="text-2xl font-bold text-foreground"
            >{formatTime(progressData.totalTimeSpent)}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Time Learned</h3>
        <p class="text-sm text-muted-foreground">
          Total study time across all lessons
        </p>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <Zap class="w-8 h-8 text-orange-500" />
          <span class="text-2xl font-bold text-foreground"
            >{progressData.currentStreak}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Day Streak</h3>
        <p class="text-sm text-muted-foreground">
          Consecutive days of learning
        </p>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <MessageSquare class="w-8 h-8 text-green-500" />
          <span class="text-2xl font-bold text-foreground"
            >{progressData.totalSessions}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">AI Chats</h3>
        <p class="text-sm text-muted-foreground">
          Conversations with AI tutors
        </p>
      </Card>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Next Lessons -->
      <div class="lg:col-span-2">
        <Card class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-foreground">
              Continue Learning
            </h2>
            <Button variant="outline" size="sm">
              <BookOpen class="w-4 h-4 mr-2" />
              Browse All
            </Button>
          </div>

          {#if nextLessons.length === 0}
            <div class="text-center py-8">
              <Target class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 class="font-semibold text-foreground mb-2">Great work!</h3>
              <p class="text-muted-foreground">
                You're all caught up. Check back soon for new content.
              </p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each nextLessons as lesson}
                <div
                  class="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div class="flex items-center space-x-4">
                    <div
                      class={`w-10 h-10 rounded-full flex items-center justify-center ${
                        lesson.isInProgress
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : "bg-gray-100 dark:bg-gray-900/20"
                      }`}
                    >
                      {#if lesson.isInProgress}
                        <Play class="w-5 h-5 text-blue-600" />
                      {:else}
                        <Circle class="w-5 h-5 text-gray-600" />
                      {/if}
                    </div>
                    <div class="flex-1">
                      <h4 class="font-medium text-foreground">
                        {lesson.title}
                      </h4>
                      <p class="text-sm text-muted-foreground">
                        {lesson.module.title} • {lesson.contentCount} items
                      </p>
                      {#if lesson.title}
                        <p class="text-sm text-muted-foreground mt-1">
                          {lesson.title.length > 80
                            ? lesson.title.substring(0, 80) + "..."
                            : lesson.title}
                        </p>
                      {/if}
                    </div>
                  </div>
                  <Button size="sm" on:click={() => startLesson(lesson)}>
                    {lesson.isInProgress ? "Continue" : "Start"}
                    <ArrowRight class="w-4 h-4 ml-1" />
                  </Button>
                </div>
              {/each}
            </div>
          {/if}
        </Card>
      </div>

      <!-- Sidebar Content -->
      <div class="space-y-6">
        <!-- Weekly Progress -->
        <Card class="p-6">
          <h3 class="font-semibold text-foreground mb-4 flex items-center">
            <BarChart3 class="w-5 h-5 mr-2" />
            This Week
          </h3>
          <div class="grid grid-cols-7 gap-2">
            {#each weeklyProgress as day}
              <div class="text-center">
                <div
                  class={`h-8 w-full rounded-sm mb-1 ${
                    day.active ? "bg-primary" : "bg-muted"
                  }`}
                  title={`${day.date}: ${day.minutes} minutes`}
                ></div>
                <span class="text-xs text-muted-foreground">{day.day}</span>
              </div>
            {/each}
          </div>
          <p class="text-xs text-muted-foreground mt-3 text-center">
            Daily learning activity
          </p>
        </Card>

        <!-- Recent Activity -->
        <Card class="p-6">
          <h3 class="font-semibold text-foreground mb-4 flex items-center">
            <Clock class="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          {#if recentActivity.length === 0}
            <p class="text-muted-foreground text-sm text-center py-4">
              No recent activity
            </p>
          {:else}
            <div class="space-y-3">
              {#each recentActivity as activity}
                <div class="flex items-center space-x-3">
                  <div
                    class={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === "lesson"
                        ? activity.status === "done"
                          ? "bg-green-100 dark:bg-green-900/20"
                          : "bg-blue-100 dark:bg-blue-900/20"
                        : "bg-purple-100 dark:bg-purple-900/20"
                    }`}
                  >
                    <svelte:component
                      this={activity.icon}
                      class={`w-4 h-4 ${
                        activity.type === "lesson"
                          ? activity.status === "done"
                            ? "text-green-600"
                            : "text-blue-600"
                          : "text-purple-600"
                      }`}
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {activity.subtitle} • {formatDate(activity.time)}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card>

        <!-- Achievements -->
        <Card class="p-6">
          <h3 class="font-semibold text-foreground mb-4 flex items-center">
            <Award class="w-5 h-5 mr-2" />
            Achievements
          </h3>
          {#await loadAchievements()}
            <div class="animate-pulse space-y-3">
              {#each Array(3) as _}
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-muted rounded-full"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-muted rounded w-3/4"></div>
                    <div class="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              {/each}
            </div>
          {:then achievements}
            <div class="space-y-3">
              {#each achievements.slice(0, 4) as achievement}
                <div
                  class={`flex items-center space-x-3 ${
                    achievement.earned ? "" : "opacity-50"
                  }`}
                >
                  <div class="text-2xl">
                    {achievement.icon}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-foreground">
                      {achievement.title}
                      {#if achievement.earned}
                        <CheckCircle
                          class="w-4 h-4 text-green-600 inline ml-1"
                        />
                      {/if}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {/await}
        </Card>
      </div>
    </div>

    <!-- Quick Actions -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button class="h-20 flex-col space-y-2" variant="outline">
          <MessageSquare class="w-6 h-6" />
          <span>Start AI Chat</span>
        </Button>
        <Button class="h-20 flex-col space-y-2" variant="outline">
          <BookOpen class="w-6 h-6" />
          <span>Browse Lessons</span>
        </Button>
        <Button class="h-20 flex-col space-y-2" variant="outline">
          <TrendingUp class="w-6 h-6" />
          <span>View Progress</span>
        </Button>
      </div>
    </Card>
  </div>
{/if}
