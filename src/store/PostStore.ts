import { create } from "zustand";
import type { PostData,PostStore,PostUser } from "@/types";

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  loading: false,
  saving: false,
  deleting: false,

  error: "",
  success: "",

  title: "",
  description: "",
  image: null,

  editingId: null,

  setTitle: (title) => {
    set({
      title,
      error: "",
      success: "",
    });
  },

  setDescription: (description) => {
    set({
      description,
      error: "",
      success: "",
    });
  },

  setImage: (image) => {
    set({
      image,
      error: "",
    });
  },

  setError: (error) => {
    set({
      error,
    });
  },

  setSuccess: (success) => {
    set({
      success,
    });
  },

  setEditingId: (editingId) => {
    set({
      editingId,
    });
  },

  loadPosts: async () => {
    try {
      set({
        loading: true,
        error: "",
      });

      const response = await fetch("/api/posts", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load posts.");
      }

      set({
        posts: Array.isArray(data.posts) ? data.posts : [],
      });
    } catch (error) {
      console.error("Load posts error:", error);

      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load posts.",
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  createOrUpdatePost: async () => {
    const {
      title,
      description,
      image,
      editingId,
      loadPosts,
    } = get();

    set({
      error: "",
      success: "",
    });

    if (!title.trim()) {
      set({
        error: "Title is required.",
      });

      return false;
    }

    if (!description.trim()) {
      set({
        error: "Description is required.",
      });

      return false;
    }

    try {
      set({
        saving: true,
      });

      const method = editingId !== null ? "PUT" : "POST";

      const response = await fetch("/api/posts", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          title: title.trim(),
          description: description.trim(),
          image,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save post.",
        );
      }

      set({
        success:
          editingId !== null
            ? "Post updated successfully."
            : "Post created successfully.",
      });

      set({
        editingId: null,
        title: "",
        description: "",
        image: null,
      });

      await loadPosts();

      return true;
    } catch (error) {
      console.error("Save post error:", error);

      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to save post.",
      });

      return false;
    } finally {
      set({
        saving: false,
      });
    }
  },

  deletePost: async (id) => {
    const { loadPosts } = get();

    try {
      set({
        deleting: true,
        error: "",
        success: "",
      });

      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete post.",
        );
      }

      set({
        success: "Post deleted successfully.",
      });

      await loadPosts();

      return true;
    } catch (error) {
      console.error("Delete post error:", error);

      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete post.",
      });

      return false;
    } finally {
      set({
        deleting: false,
      });
    }
  },

  editPost: (post) => {
    set({
      editingId: post.id,
      title: post.title,
      description: post.description,
      image: post.image,
      error: "",
      success: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },

  resetForm: () => {
    set({
      editingId: null,
      title: "",
      description: "",
      image: null,
      error: "",
      success: "",
    });
  },

  clearMessages: () => {
    set({
      error: "",
      success: "",
    });
  },
}));