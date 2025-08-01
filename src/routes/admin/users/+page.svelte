<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, isAdmin } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";
  import { toastStore } from "$lib/stores/toast";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Select from "$lib/components/ui/select.svelte";
     import {
     Users,
     Plus,
     Edit,
     Trash2,
     Shield,
     User,
     UserCheck,
     AlertCircle,
     Search,
     Filter,
     Loader2,
     Mail,
     BookOpen,
   } from "lucide-svelte";

  let users: any[] = [];
  let filteredUsers = users;
  let searchQuery = "";
  let roleFilter = "all";
  let createDialogOpen = false;
  let editDialogOpen = false;
  let deleteDialogOpen = false;
  let loading = false;
  let error = "";

  let newUser = {
    email: "",
    password: "",
    role: "Student",
    addToAllowlist: true,
    createWithPassword: false,
  };

  let editUser = {
    id: "",
    email: "",
    role: "",
    status: "",
    newPassword: "",
  };

  let moduleAssignmentDialogOpen = false;
  let selectedUserForModules: any = null;
  let availableModules: any[] = [];
  let assignedModuleIds: string[] = [];
  let moduleAssignmentLoading = false;

  let userToDelete: any = null;

  $: user = $authStore.user;
  $: canAccess = isAdmin();

  const roleOptions = [
    { label: "Admin", value: "Admin" },
    { label: "Collaborator", value: "Collaborator" },
    { label: "Student", value: "Student" },
  ];

  const filterOptions = [
    { label: "All Roles", value: "all" },
    { label: "Admin", value: "Admin" },
    { label: "Collaborator", value: "Collaborator" },
    { label: "Student", value: "Student" },
  ];

  async function loadUsers() {
    loading = true;
    error = "";

    try {
      // Load existing users
      const { data: existingUsers, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Load allowlisted users
      const { data: allowlistedUsers, error: allowlistError } = await supabase
        .from("allowlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (allowlistError) throw allowlistError;

      // Format existing users (these have proper UUID IDs from auth.users)
      const existingUsersFormatted = (existingUsers || []).map((user) => ({
        ...user,
        status: "active",
        is_allowlisted: false,
        source: "existing",
        canEdit: true, // These users can be edited
      }));

      // Format allowlisted users (these have different IDs and can't be edited the same way)
      const allowlistedUsersFormatted = (allowlistedUsers || []).map(
        (allowlistEntry) => ({
          id: allowlistEntry.id,
          email: allowlistEntry.email,
          role: allowlistEntry.role,
          created_at: allowlistEntry.created_at,
          updated_at: allowlistEntry.updated_at,
          status: "pending",
          is_allowlisted: true,
          source: "allowlist",
          canEdit: false, // These users can't be edited until they sign up
        })
      );

      // Combine both lists, prioritizing existing users (remove allowlist entries for existing users)
      const existingEmails = new Set(
        existingUsersFormatted.map((u) => u.email)
      );
      const uniqueAllowlistedUsers = allowlistedUsersFormatted.filter(
        (u) => !existingEmails.has(u.email)
      );

      users = [...existingUsersFormatted, ...uniqueAllowlistedUsers];
      filterUsers();
    } catch (err) {
      console.error("❌ Error loading users:", err);
      error = err instanceof Error ? err.message : "Failed to load users";
    } finally {
      loading = false;
    }
  }

  async function addToAllowlist() {
    try {
      // Add user to allowlist
      const { data: newAllowlistEntry, error: allowlistError } = await supabase
        .from("allowlist")
        .insert({
          email: newUser.email,
          role: newUser.role,
          invited_by: user?.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (allowlistError && allowlistError.code !== "23505") {
        // Ignore duplicate key errors
        throw allowlistError;
      }

      console.log("✅ User added to allowlist:", newUser.email);

      // Reload users to show the new allowlisted user
      await loadUsers();

      createDialogOpen = false;
      newUser = {
        email: "",
        password: "",
        role: "Student",
        addToAllowlist: true,
        createWithPassword: false,
      };

      // Show success message
      toastStore.success(
        `${newUser.email} has been added to the allowlist. They can now sign up directly.`
      );
    } catch (err) {
      console.error("❌ Error adding user to allowlist:", err);
      error =
        err instanceof Error ? err.message : "Failed to add user to allowlist";
      toastStore.error(error);
    }
  }

  async function createUserWithPassword() {
    try {
      if (!newUser.email.trim() || !newUser.password.trim()) {
        error = "Email and password are required";
        return;
      }

      if (newUser.password.length < 8) {
        error = "Password must be at least 8 characters long";
        return;
      }

      console.log("🔍 Creating user:", {
        email: newUser.email,
        role: newUser.role,
      });

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      console.log("✅ User created successfully:", result.user);

      // Reload users to show the new user
      await loadUsers();

      createDialogOpen = false;
      newUser = {
        email: "",
        password: "",
        role: "Student",
        addToAllowlist: true,
        createWithPassword: false,
      };

      // Show success message
      toastStore.success(
        `${newUser.email} has been created successfully. They can sign in with their email and password.`
      );
    } catch (err) {
      console.error("❌ Error creating user:", err);
      error = err instanceof Error ? err.message : "Failed to create user";
      toastStore.error(error);
    }
  }

  async function updateUser() {
    try {
      // Update user profile in database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: editUser.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editUser.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (editUser.newPassword.trim()) {
        if (editUser.newPassword.length < 8) {
          error = "Password must be at least 8 characters long";
          return;
        }

        console.log("🔍 Updating user:", editUser.email);

        const response = await fetch("/api/admin/update-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: editUser.id,
            role: editUser.role,
            password: editUser.newPassword,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update user password");
        }

        console.log("✅ User password updated successfully");
      }

      console.log("✅ User updated:", editUser.email);

      // Reload users
      await loadUsers();

      // Show success message before clearing the password
      const hadPassword = editUser.newPassword.trim().length > 0;
      const message = hadPassword
        ? `${editUser.email} has been updated successfully. Password has been reset.`
        : `${editUser.email} has been updated successfully.`;
      toastStore.success(message);

      editDialogOpen = false;
      editUser.newPassword = "";
    } catch (err) {
      console.error("❌ Error updating user:", err);
      error = err instanceof Error ? err.message : "Failed to update user";
      toastStore.error(error);
    }
  }

  async function deleteUser() {
    if (!userToDelete) return;

    try {
      if (userToDelete.source === "allowlist") {
        // Delete from allowlist
        const { error: deleteError } = await supabase
          .from("allowlist")
          .delete()
          .eq("id", userToDelete.id);

        if (deleteError) throw deleteError;
        console.log("✅ User removed from allowlist:", userToDelete.email);
      } else {
        // Delete existing user
        const { error: deleteError } = await supabase
          .from("users")
          .delete()
          .eq("id", userToDelete.id);

        if (deleteError) throw deleteError;
        console.log("✅ User deleted:", userToDelete.email);
      }

      // Store email before clearing userToDelete
      const deletedEmail = userToDelete.email;

      // Reload users
      await loadUsers();

      deleteDialogOpen = false;
      userToDelete = null;

      // Show success message
      toastStore.success(
        `${deletedEmail} has been deleted successfully.`
      );
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      error = err instanceof Error ? err.message : "Failed to delete user";
      toastStore.error(error);
    }
  }

  function filterUsers() {
    filteredUsers = users.filter((user) => {
      const matchesSearch = user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }

  $: {
    searchQuery, roleFilter;
    filterUsers();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "Admin":
        return Shield;
      case "Collaborator":
        return UserCheck;
      case "Student":
        return User;
      default:
        return User;
    }
  }

  function getRoleColor(role: string): string {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "Collaborator":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "Student":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  }

  function openCreateDialog() {
    newUser = {
      email: "",
      password: "",
      role: "Student",
      addToAllowlist: true,
      createWithPassword: false,
    };
    createDialogOpen = true;
  }

  function openEditDialog(user: any) {
    // Only allow editing of existing users (not allowlisted users)
    if (user.source !== "existing") {
      toastStore.error(
        "Cannot edit allowlisted users. They must sign up first."
      );
      return;
    }

    editUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: "active", // Users are always active in our system
      newPassword: "",
    };
    editDialogOpen = true;
  }

  function openDeleteDialog(user: any) {
    userToDelete = user;
    deleteDialogOpen = true;
  }

  async function openModuleAssignmentDialog(user: any) {
    selectedUserForModules = user;
    moduleAssignmentLoading = true;
    moduleAssignmentDialogOpen = true;

    try {
      const response = await fetch(`/api/admin/user-module-assignments?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        availableModules = data.availableModules;
        assignedModuleIds = data.assignedModuleIds;
      } else {
        toastStore.error("Failed to load module assignments");
      }
    } catch (error) {
      console.error("❌ Error loading module assignments:", error);
      toastStore.error("Failed to load module assignments");
    } finally {
      moduleAssignmentLoading = false;
    }
  }

  async function saveModuleAssignments() {
    if (!selectedUserForModules) return;

    moduleAssignmentLoading = true;

    try {
      const response = await fetch("/api/admin/user-module-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserForModules.id,
          moduleIds: assignedModuleIds,
          assignedBy: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toastStore.success(data.message);
        moduleAssignmentDialogOpen = false;
        selectedUserForModules = null;
      } else {
        toastStore.error(data.error || "Failed to save module assignments");
      }
    } catch (error) {
      console.error("❌ Error saving module assignments:", error);
      toastStore.error("Failed to save module assignments");
    } finally {
      moduleAssignmentLoading = false;
    }
  }

  onMount(() => {
    if (canAccess) {
      loadUsers();
    }
  });
</script>

<svelte:head>
  <title>User Management - BigStepLabs Admin</title>
</svelte:head>

{#if !canAccess}
  <Card class="p-8 text-center">
    <AlertCircle class="w-16 h-16 text-destructive mx-auto mb-4" />
    <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
    <p class="text-muted-foreground">
      You need Admin privileges to manage users.
    </p>
  </Card>
{:else}
  <!-- Page Header -->
  <div
    class="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-xl lg:text-2xl font-bold text-foreground">
        User Management
      </h1>
      <p class="text-sm lg:text-base text-muted-foreground">
        Manage user accounts, roles, and allowlist access
      </p>
    </div>
    <Button on:click={openCreateDialog} class="w-full sm:w-auto">
      <Plus class="w-4 h-4 mr-2" />
      Add User
    </Button>
  </div>

  <!-- Filters -->
  <Card class="p-6 mb-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
          />
          <Input
            bind:value={searchQuery}
            placeholder="Search users by email..."
            class="pl-10"
          />
        </div>
      </div>
      <div class="sm:w-48">
        <Select bind:value={roleFilter} options={filterOptions} />
      </div>
    </div>
  </Card>

  <!-- Users List -->
  <Card class="overflow-hidden">
    <!-- Desktop Table View -->
    <div class="hidden lg:block overflow-x-auto">
      <table class="w-full">
        <thead class="bg-muted/50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              User
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Role
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Created
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Last Login
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-background divide-y divide-border">
          {#if loading}
            <tr>
              <td colspan="6" class="px-6 py-4 text-center">
                <Loader2 class="w-6 h-6 text-primary animate-spin" />
                <span class="ml-2">Loading users...</span>
              </td>
            </tr>
          {:else if error}
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-destructive">
                {error}
              </td>
            </tr>
          {:else}
            {#each filteredUsers as user (user.id)}
              <tr class="hover:bg-muted/25">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-primary">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-foreground">
                        {user.email}
                      </div>
                      <div class="text-sm text-muted-foreground">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                  >
                    <svelte:component
                      this={getRoleIcon(user.role)}
                      class="w-3 h-3 mr-1"
                    />
                    {user.role}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                >
                  {formatDate(user.created_at)}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                >
                  {user.last_login ? formatDate(user.last_login) : "Never"}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_allowlisted
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        : user.canEdit
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                    }`}
                  >
                    {user.is_allowlisted
                      ? "Allowlisted"
                      : user.canEdit
                        ? "Active"
                        : "Pending"}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                                     <div class="flex items-center justify-end space-x-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       on:click={() => openEditDialog(user)}
                       disabled={!user.canEdit}
                     >
                       <Edit class="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       on:click={() => openModuleAssignmentDialog(user)}
                       disabled={!user.canEdit}
                     >
                       <BookOpen class="w-4 h-4" />
                     </Button>
                     {#if user.email !== "jdpinetta@gmail.com"}
                       <Button
                         variant="ghost"
                         size="sm"
                         on:click={() => openDeleteDialog(user)}
                         class="text-destructive hover:text-destructive"
                       >
                         <Trash2 class="w-4 h-4" />
                       </Button>
                     {/if}
                   </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="lg:hidden">
      {#if loading}
        <div class="p-6 text-center">
          <Loader2 class="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
          <span class="text-muted-foreground">Loading users...</span>
        </div>
      {:else if error}
        <div class="p-6 text-center text-destructive">
          {error}
        </div>
      {:else}
        <div class="space-y-3 p-4">
          {#each filteredUsers as user (user.id)}
            <Card class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <span class="text-sm font-medium text-primary">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-foreground truncate">
                      {user.email}
                    </h3>
                    <p class="text-xs text-muted-foreground">
                      ID: {user.id}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    on:click={() => openEditDialog(user)}
                    disabled={!user.canEdit}
                    class="h-8 w-8 p-0"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  {#if user.email !== "jdpinetta@gmail.com"}
                    <Button
                      variant="ghost"
                      size="sm"
                      on:click={() => openDeleteDialog(user)}
                      class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  {/if}
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Role:</span>
                  <span
                    class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                  >
                    <svelte:component
                      this={getRoleIcon(user.role)}
                      class="w-3 h-3 mr-1"
                    />
                    {user.role}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Created:</span>
                  <span class="text-xs text-foreground">
                    {formatDate(user.created_at)}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Last Login:</span>
                  <span class="text-xs text-foreground">
                    {user.last_login ? formatDate(user.last_login) : "Never"}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Status:</span>
                  <span
                    class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_allowlisted
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        : user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                    }`}
                  >
                    {user.is_allowlisted ? "Allowlisted" : user.status}
                  </span>
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </div>
  </Card>

  <!-- Summary Stats -->
  <div
    class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mt-6"
  >
    <Card class="p-3 lg:p-4">
      <div class="flex items-center">
        <Users class="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
        <div class="ml-3 lg:ml-4">
          <div class="text-lg lg:text-2xl font-bold text-foreground">
            {users.length}
          </div>
          <div class="text-xs lg:text-sm text-muted-foreground">
            Total Users
          </div>
        </div>
      </div>
    </Card>
    <Card class="p-3 lg:p-4">
      <div class="flex items-center">
        <Shield class="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
        <div class="ml-3 lg:ml-4">
          <div class="text-lg lg:text-2xl font-bold text-foreground">
            {users.filter((u) => u.role === "Admin").length}
          </div>
          <div class="text-xs lg:text-sm text-muted-foreground">Admins</div>
        </div>
      </div>
    </Card>
    <Card class="p-3 lg:p-4">
      <div class="flex items-center">
        <UserCheck class="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
        <div class="ml-3 lg:ml-4">
          <div class="text-lg lg:text-2xl font-bold text-foreground">
            {users.filter((u) => u.role === "Collaborator").length}
          </div>
          <div class="text-xs lg:text-sm text-muted-foreground">
            Collaborators
          </div>
        </div>
      </div>
    </Card>
    <Card class="p-3 lg:p-4">
      <div class="flex items-center">
        <User class="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
        <div class="ml-3 lg:ml-4">
          <div class="text-lg lg:text-2xl font-bold text-foreground">
            {users.filter((u) => u.role === "Student").length}
          </div>
          <div class="text-xs lg:text-sm text-muted-foreground">Students</div>
        </div>
      </div>
    </Card>
    <Card class="p-4">
      <div class="flex items-center">
        <UserCheck class="w-8 h-8 text-purple-600" />
        <div class="ml-4">
          <div class="text-2xl font-bold text-foreground">
            {users.filter((u) => u.is_allowlisted).length}
          </div>
          <div class="text-sm text-muted-foreground">Allowlisted</div>
        </div>
      </div>
    </Card>
  </div>

  <!-- Create User Dialog -->
  <Dialog bind:open={createDialogOpen} title="Create New User">
    <div class="space-y-4">
      <div>
        <label for="user-email" class="block text-sm font-medium mb-2"
          >Email Address *</label
        >
        <Input
          id="user-email"
          bind:value={newUser.email}
          type="email"
          placeholder="user@example.com"
          required
        />
      </div>

      <div>
        <label for="user-role" class="block text-sm font-medium mb-2"
          >Role *</label
        >
        <Select
          id="user-role"
          bind:value={newUser.role}
          options={roleOptions}
        />
      </div>

      <!-- Authentication Method Toggle -->
      <div class="space-y-3">
        <label class="block text-sm font-medium">Authentication Method</label>
        <div class="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            type="button"
            class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors {!newUser.createWithPassword
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'}"
            on:click={() => (newUser.createWithPassword = false)}
          >
            <Mail class="w-4 h-4 inline mr-2" />
            Magic Link
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors {newUser.createWithPassword
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'}"
            on:click={() => (newUser.createWithPassword = true)}
          >
            <User class="w-4 h-4 inline mr-2" />
            User + Password
          </button>
        </div>
      </div>

      <!-- Password Field (when password method is selected) -->
      {#if newUser.createWithPassword}
        <div>
          <label for="user-password" class="block text-sm font-medium mb-2"
            >Password *</label
          >
          <Input
            id="user-password"
            bind:value={newUser.password}
            type="password"
            placeholder="Enter password"
            required
          />
        </div>
      {/if}

      <!-- Magic Link Info (when magic link method is selected) -->
      {#if !newUser.createWithPassword}
        <div
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4"
        >
          <div class="flex">
            <Mail
              class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
            />
            <div class="ml-3">
              <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Magic Link Authentication
              </h4>
              <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                The user will receive a magic link via email to sign in. No
                password required.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Password Info (when password method is selected) -->
      {#if newUser.createWithPassword}
        <div
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4"
        >
          <div class="flex">
            <User
              class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
            />
            <div class="ml-3">
              <h4
                class="text-sm font-medium text-green-800 dark:text-green-200"
              >
                Password Authentication
              </h4>
              <p class="mt-1 text-sm text-green-700 dark:text-green-300">
                The user will be created with the specified password and can
                sign in directly.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Allowlist Option (only show when magic link method is selected) -->
      {#if !newUser.createWithPassword}
        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="send-invite"
            bind:checked={newUser.addToAllowlist}
            class="rounded border-input"
          />
          <label for="send-invite" class="text-sm font-medium">
            Allow this user to sign up directly
          </label>
        </div>
      {/if}
    </div>

    <div slot="footer" class="flex justify-end space-x-2">
      <Button variant="outline" on:click={() => (createDialogOpen = false)}>
        Cancel
      </Button>
      {#if newUser.createWithPassword}
        <Button
          on:click={createUserWithPassword}
          disabled={!newUser.email.trim() || !newUser.password.trim()}
        >
          Create User with Password
        </Button>
      {:else}
        <Button on:click={addToAllowlist} disabled={!newUser.email.trim()}>
          Add to Allowlist
        </Button>
      {/if}
    </div>
  </Dialog>

  <!-- Edit User Dialog -->
  <Dialog bind:open={editDialogOpen} title="Edit User">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Email Address</label>
        <Input value={editUser.email} disabled class="bg-muted" />
        <p class="text-xs text-muted-foreground mt-1">
          Email cannot be changed
        </p>
      </div>

      <div>
        <label for="edit-user-role" class="block text-sm font-medium mb-2"
          >Role *</label
        >
        <Select
          id="edit-user-role"
          bind:value={editUser.role}
          options={roleOptions}
        />
      </div>

      <div>
        <label for="edit-user-status" class="block text-sm font-medium mb-2"
          >Status</label
        >
        <Select
          id="edit-user-status"
          bind:value={editUser.status}
          options={[
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Suspended", value: "suspended" },
          ]}
        />
      </div>

      <div>
        <label for="edit-user-password" class="block text-sm font-medium mb-2"
          >New Password (optional)</label
        >
        <Input
          id="edit-user-password"
          bind:value={editUser.newPassword}
          type="password"
          placeholder="Leave blank to keep current password"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Enter a new password to reset the user's password (min 8 characters)
        </p>
      </div>
    </div>

    <div slot="footer" class="flex justify-end space-x-2">
      <Button variant="outline" on:click={() => (editDialogOpen = false)}>
        Cancel
      </Button>
      <Button on:click={updateUser}>
        {editUser.newPassword.trim()
          ? "Save Changes & Reset Password"
          : "Save Changes"}
      </Button>
    </div>
  </Dialog>

  <!-- Delete User Dialog -->
  <Dialog bind:open={deleteDialogOpen} title="Delete User">
    {#if userToDelete}
      <div class="space-y-4">
        <div
          class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
        >
          <div class="flex">
            <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
            <div class="ml-3">
              <h4 class="text-sm font-medium text-destructive">
                This action cannot be undone
              </h4>
              <p class="mt-1 text-sm text-destructive/80">
                Are you sure you want to delete the user <strong
                  >{userToDelete.email}</strong
                >? This will permanently remove their account and all associated
                data.
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div slot="footer" class="flex justify-end space-x-2">
      <Button variant="outline" on:click={() => (deleteDialogOpen = false)}>
        Cancel
      </Button>
             <Button variant="destructive" on:click={deleteUser}>Delete User</Button>
     </div>
   </Dialog>

   <!-- Module Assignment Dialog -->
   <Dialog bind:open={moduleAssignmentDialogOpen} title="Assign Modules to User">
     {#if selectedUserForModules}
       <div class="space-y-4">
         <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
           <div class="flex">
             <BookOpen class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
             <div class="ml-3">
               <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                 Module Access Control
               </h4>
               <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                 Select which modules <strong>{selectedUserForModules.email}</strong> can access. 
                 Students will only see assigned modules in their dashboard.
               </p>
             </div>
           </div>
         </div>

         {#if moduleAssignmentLoading}
           <div class="flex items-center justify-center py-8">
             <Loader2 class="w-6 h-6 text-primary animate-spin" />
             <span class="ml-2">Loading modules...</span>
           </div>
         {:else}
           <div class="space-y-3">
             <label class="block text-sm font-medium">Available Modules</label>
             {#each availableModules as module}
               <div class="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/25">
                 <input
                   type="checkbox"
                   id={`module-${module.id}`}
                   bind:group={assignedModuleIds}
                   value={module.id}
                   class="rounded border-input"
                 />
                 <label for={`module-${module.id}`} class="flex-1 cursor-pointer">
                   <div class="font-medium">{module.title}</div>
                   {#if module.description}
                     <div class="text-sm text-muted-foreground">{module.description}</div>
                   {/if}
                 </label>
               </div>
             {/each}
           </div>
         {/if}
       </div>
     {/if}

     <div slot="footer" class="flex justify-end space-x-2">
       <Button variant="outline" on:click={() => (moduleAssignmentDialogOpen = false)}>
         Cancel
       </Button>
       <Button 
         on:click={saveModuleAssignments}
         disabled={moduleAssignmentLoading}
       >
         {#if moduleAssignmentLoading}
           <Loader2 class="w-4 h-4 mr-2 animate-spin" />
         {/if}
         Save Assignments
       </Button>
     </div>
   </Dialog>
 {/if}
