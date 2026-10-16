"use client";

import { useEffect } from "react";

import "./post.css";

import type { PostData } from "@/types";
import { usePostStore } from "@/store/PostStore";

export default function Post() {
  const posts = usePostStore((state) => state.posts);

  const loading = usePostStore((state) => state.loading);
  const saving = usePostStore((state) => state.saving);
  const deleting = usePostStore((state) => state.deleting);

  const error = usePostStore((state) => state.error);
  const success = usePostStore((state) => state.success);

  const title = usePostStore((state) => state.title);
  const description = usePostStore((state) => state.description);
  const image = usePostStore((state) => state.image);

  const editingId = usePostStore((state) => state.editingId);

  const setTitle = usePostStore((state) => state.setTitle);
  const setDescription = usePostStore((state) => state.setDescription);
  const setImage = usePostStore((state) => state.setImage);

  const loadPosts = usePostStore((state) => state.loadPosts);
  const createOrUpdatePost = usePostStore((state) => state.createOrUpdatePost);
  const deletePost = usePostStore((state) => state.deletePost);
  const editPost = usePostStore((state) => state.editPost);
  const resetForm = usePostStore((state) => state.resetForm);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      usePostStore
        .getState()
        .setError("Only PNG, JPEG and WebP images are allowed.");

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      usePostStore.getState().setError("Image size must be less than 5MB.");

      return;
    }

    usePostStore.getState().setError("");

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await createOrUpdatePost();
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) {
      return;
    }

    await deletePost(id);
  };

  return (
    <div className="post-container">
      {/* Header */}

      <div className="post-header">
        <div>
          <h1>Posts</h1>

          <p>Manage posts from all users</p>
        </div>

        <div className="post-count">{posts.length} Posts</div>
      </div>

      {/* Messages */}

      {error && (
        <div className="post-message post-message-error">
          <i className="pi pi-exclamation-circle" />
          {error}
        </div>
      )}

      {success && (
        <div className="post-message post-message-success">
          <i className="pi pi-check-circle" />
          {success}
        </div>
      )}

      {/* Form */}

      <div className="post-form-card">
        <div className="post-form-header">
          <div>
            <h2>{editingId !== null ? "Edit Post" : "Create New Post"}</h2>

            <p>
              {editingId !== null ? "Update your post" : "Create a new post"}
            </p>
          </div>

          {/* Cancel button - always visible */}

          <button type="button" className="post-cancel-btn" onClick={resetForm}>
            <i className="pi pi-times" />
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}

          <div className="post-form-group">
            <label htmlFor="post-title">Title</label>

            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter post title"
            />
          </div>

          {/* Description */}

          <div className="post-form-group">
            <label htmlFor="post-description">Description</label>

            <textarea
              id="post-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter post description"
              rows={5}
            />
          </div>

          {/* Image */}

          <div className="post-form-group">
            <label htmlFor="post-image">Image</label>

            <input
              id="post-image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
            />
          </div>

          {/* Image Preview */}

          {image && (
            <div className="post-image-preview">
              <img src={image} alt="Post preview" />

              <button
                type="button"
                onClick={() => setImage(null)}
                className="remove-image-btn"
              >
                <i className="pi pi-times" />
              </button>
            </div>
          )}

          {/* Form Actions */}

          <div className="post-form-actions">
            <button type="submit" className="post-submit-btn" disabled={saving}>
              <i
                className={
                  saving
                    ? "pi pi-spin pi-spinner"
                    : editingId !== null
                      ? "pi pi-save"
                      : "pi pi-plus"
                }
              />

              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Post"
                  : "Create Post"}
            </button>
          </div>
        </form>
      </div>

      {/* Posts */}

      <div className="post-list-section">
        <div className="post-list-header">
          <h2>All Posts</h2>

          <span>{posts.length} posts</span>
        </div>

        {/* Loading */}

        {loading && (
          <div className="post-loading">
            <i className="pi pi-spin pi-spinner" />

            <span>Loading posts...</span>
          </div>
        )}

        {/* Empty */}

        {!loading && posts.length === 0 && (
          <div className="post-empty">
            <i className="pi pi-file-edit" />

            <h3>No Posts</h3>

            <p>No posts have been created yet.</p>
          </div>
        )}

        {/* Post Grid */}

        {!loading && posts.length > 0 && (
          <div className="post-grid">
            {posts.map((post: PostData) => (
              <article key={post.id} className="post-card">
                {/* Post Image */}

                {post.image && (
                  <div className="post-card-image">
                    <img src={post.image} alt={post.title} />
                  </div>
                )}

                <div className="post-card-content">
                  {/* User */}

                  <div className="post-user">
                    <div className="post-avatar">
                      {post.user.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="post-user-info">
                      <strong>{post.user.name}</strong>

                      <span>@{post.user.username}</span>
                    </div>
                  </div>

                  {/* Title */}

                  <h4>Title: {post.title}</h4>

                  {/* Description */}

                  <p>Descriptions: {post.description}</p>

                  {/* Date */}

                  <div className="post-date">
                    <i className="pi pi-clock" />

                    {new Date(post.createdAt).toLocaleString()}
                  </div>

                  {/* Actions */}

                  <div className="post-card-actions">
                    <button
                      type="button"
                      className="post-edit-btn"
                      onClick={() => editPost(post)}
                    >
                      <i className="pi pi-pencil" />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="post-delete-btn"
                      disabled={deleting}
                      onClick={() => handleDelete(post.id)}
                    >
                      <i className="pi pi-trash" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
