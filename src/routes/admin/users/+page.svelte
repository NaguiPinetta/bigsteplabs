<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, isAdmin } from "$lib/stores/auth";
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
  } from "lucide-svelte";

  let users = [
    {
      id: "admin-mock-id",
      email: "admin@bigsteplabs.com",
      role: "Admin",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: "active",
    },
    // Mock additional users for demonstration
    {
      id: "user-1",
      email: "teacher@bigsteplabs.com",
      role: "Collaborator",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
    {
      id: "user-2",
      email: "student@bigsteplabs.com",
      role: "Student",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
  ];

  let filteredUsers = users;
  let searchQuery = "";
  let roleFilter = "all";
  let createDialogOpen = false;
  let editDialogOpen = false;
  let deleteDialogOpen = false;

  let newUser = {
    email: "",
    role: "Student",
    sendInvite: true,
  };

  let editUser = {
    id: "",
    email: "",
    role: "",
    status: "",
  };

  let userToDelete = null;

  $: user = $authStore.user;
  $: canAccess = isAdmin(user);

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
    newUser = { email: "", role: "Student", sendInvite: true };
    createDialogOpen = true;
  }

  function openEditDialog(user: any) {
    editUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    editDialogOpen = true;
  }

  function openDeleteDialog(user: any) {
    userToDelete = user;
    deleteDialogOpen = true;
  }

  function handleCreateUser() {
    // Mock user creation
    const mockUser = {
      id: "user-" + Date.now(),
      email: newUser.email,
      role: newUser.role,
      created_at: new Date().toISOString(),
      last_login: null,
      status: "pending",
    };

    users = [...users, mockUser];
    createDialogOpen = false;

    // Show success message (in real app, this would be a toast/notification)
    alert(`User invitation sent to ${newUser.email}`);
  }

  function handleUpdateUser() {
    users = users.map((u) =>
      u.id === editUser.id
        ? { ...u, role: editUser.role, status: editUser.status }
        : u
    );
    editDialogOpen = false;
    alert("User updated successfully");
  }

  function handleDeleteUser() {
    users = users.filter((u) => u.id !== userToDelete.id);
    deleteDialogOpen = false;
    userToDelete = null;
    alert("User deleted successfully");
  }
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
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">User Management</h1>
      <p class="text-muted-foreground">
        Manage user accounts, roles, and permissions
      </p>
    </div>
    <Button on:click={openCreateDialog}>
      <Plus class="w-4 h-4 mr-2" />
      Invite User
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
        <Select bind:value={roleFilter} options={filterOptions}>
          <Filter class="w-4 h-4 mr-2" slot="icon" />
        </Select>
      </div>
    </div>
  </Card>

  <!-- Users List -->
  <Card class="overflow-hidden">
    <div class="overflow-x-auto">
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
                    user.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                  }`}
                >
                  {user.status}
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
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  {#if user.id !== "admin-mock-id"}
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
        </tbody>
      </table>
    </div>
  </Card>

  <!-- Summary Stats -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
    <Card class="p-4">
      <div class="flex items-center">
        <Users class="w-8 h-8 text-blue-600" />
        <div class="ml-4">
          <div class="text-2xl font-bold text-foreground">{users.length}</div>
          <div class="text-sm text-muted-foreground">Total Users</div>
        </div>
      </div>
    </Card>
    <Card class="p-4">
      <div class="flex items-center">
        <Shield class="w-8 h-8 text-red-600" />
        <div class="ml-4">
          <div class="text-2xl font-bold text-foreground">
            {users.filter((u) => u.role === "Admin").length}
          </div>
          <div class="text-sm text-muted-foreground">Admins</div>
        </div>
      </div>
    </Card>
    <Card class="p-4">
      <div class="flex items-center">
        <UserCheck class="w-8 h-8 text-blue-600" />
        <div class="ml-4">
          <div class="text-2xl font-bold text-foreground">
            {users.filter((u) => u.role === "Collaborator").length}
          </div>
          <div class="text-sm text-muted-foreground">Collaborators</div>
        </div>
      </div>
    </Card>
    <Card class="p-4">
      <div class="flex items-center">
        <User class="w-8 h-8 text-green-600" />
        <div class="ml-4">
          <div class="text-2xl font-bold text-foreground">
            {users.filter((u) => u.role === "Student").length}
          </div>
          <div class="text-sm text-muted-foreground">Students</div>
        </div>
      </div>
    </Card>
  </div>

  <!-- Create User Dialog -->
  <Dialog bind:open={createDialogOpen} title="Invite New User">
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

      <div class="flex items-center space-x-2">
        <input
          type="checkbox"
          id="send-invite"
          bind:checked={newUser.sendInvite}
          class="rounded border-input"
        />
        <label for="send-invite" class="text-sm font-medium">
          Send invitation email immediately
        </label>
      </div>
    </div>

    <div slot="footer" class="flex justify-end space-x-2">
      <Button variant="outline" on:click={() => (createDialogOpen = false)}>
        Cancel
      </Button>
      <Button on:click={handleCreateUser} disabled={!newUser.email.trim()}>
        Send Invite
      </Button>
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
    </div>

    <div slot="footer" class="flex justify-end space-x-2">
      <Button variant="outline" on:click={() => (editDialogOpen = false)}>
        Cancel
      </Button>
      <Button on:click={handleUpdateUser}>Save Changes</Button>
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
      <Button variant="destructive" on:click={handleDeleteUser}>
        Delete User
      </Button>
    </div>
  </Dialog>
{/if}
