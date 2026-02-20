"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function HostGalleryPage() {
  const [loggedIn, setLoggedIn] = useState(null);
  const [loading, setLoading] = useState(true);

  // Albums view
  const [albums, setAlbums] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Album detail view
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [activeTab, setActiveTab] = useState("photos");
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // Sharing
  const [shares, setShares] = useState([]);
  const [rsvpGuests, setRsvpGuests] = useState([]);
  const [shareEmail, setShareEmail] = useState("");

  // Move/Copy modal
  const [moveTarget, setMoveTarget] = useState(null); // { photo, copy: bool }

  // Rename modal
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Legacy photos
  const [legacyPhotos, setLegacyPhotos] = useState([]);
  const [legacyTarget, setLegacyTarget] = useState("");

  const [error, setError] = useState("");

  const opts = { credentials: "include" };

  useEffect(() => {
    // Dashboard layout already guards auth; just load data directly
    setLoggedIn(true);
    Promise.all([loadAlbums(), loadLegacyPhotos(), loadRsvpGuests()]).finally(
      () => setLoading(false)
    );
  }, []);

  async function loadAlbums() {
    try {
      const res = await fetch("/api/gallery/albums", opts);
      if (res.ok) setAlbums(await res.json());
    } catch {}
  }

  async function loadLegacyPhotos() {
    try {
      const res = await fetch("/api/gallery/photos", opts);
      if (res.ok) {
        const data = await res.json();
        setLegacyPhotos(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  async function loadRsvpGuests() {
    try {
      const res = await fetch("/api/rsvp/list", opts);
      if (res.ok) {
        const data = await res.json();
        const attending = (data.rsvps || data || []).filter(
          (r) => r.attending?.toLowerCase() === "yes"
        );
        setRsvpGuests(attending);
      }
    } catch {}
  }

  // ---- Album CRUD ----

  async function handleCreateAlbum(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        setShowCreate(false);
        await loadAlbums();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create album.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRenameAlbum(e) {
    e.preventDefault();
    if (!renameValue.trim() || !renameTarget) return;
    try {
      const res = await fetch(`/api/gallery/albums/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setRenameTarget(null);
        setRenameValue("");
        await loadAlbums();
        if (selectedAlbum?.id === renameTarget.id) {
          setSelectedAlbum((prev) => ({ ...prev, name: renameValue.trim() }));
        }
      }
    } catch {}
  }

  async function handleDeleteAlbum(album) {
    if (!confirm(`Delete album "${album.name}" and all its photos?`)) return;
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
        await loadAlbums();
      }
    } catch {}
  }

  // ---- Album detail ----

  async function openAlbum(album) {
    setSelectedAlbum(album);
    setActiveTab("photos");
    setError("");
    setUploadMsg("");
    await Promise.all([loadAlbumPhotos(album.id), loadAlbumShares(album.id)]);
  }

  async function loadAlbumPhotos(albumId) {
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/gallery/albums/${albumId}/photos`, opts);
      if (res.ok) setPhotos(await res.json());
    } catch {}
    setLoadingPhotos(false);
  }

  async function loadAlbumShares(albumId) {
    try {
      const res = await fetch(`/api/gallery/albums/${albumId}/shares`, opts);
      if (res.ok) setShares(await res.json());
    } catch {}
  }

  // ---- Upload ----

  async function handleUpload(files) {
    if (!files || !files.length || !selectedAlbum) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) { setError("No image files selected."); return; }

    setUploading(true);
    setUploadMsg(`Uploading ${imageFiles.length} photo${imageFiles.length !== 1 ? "s" : ""}...`);
    setError("");

    try {
      const formData = new FormData();
      imageFiles.forEach((f) => formData.append("photos", f));

      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed."); return; }

      setUploadMsg(`${data.uploaded} photo${data.uploaded !== 1 ? "s" : ""} uploaded!`);
      await loadAlbumPhotos(selectedAlbum.id);
      setTimeout(() => setUploadMsg(""), 3000);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ---- Photo delete ----

  async function handleDeletePhoto(photo) {
    if (!confirm("Delete this photo?")) return;
    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ path: photo.path }),
      });
      if (res.ok) setPhotos((prev) => prev.filter((p) => p.path !== photo.path));
    } catch {}
  }

  // ---- Move / Copy ----

  async function handleMoveCopy() {
    if (!moveTarget) return;
    const { photo, copy, targetAlbumId } = moveTarget;
    if (!targetAlbumId) return;

    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/photos/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sourcePath: photo.path, targetAlbumId, copy }),
      });
      if (res.ok) {
        setMoveTarget(null);
        if (!copy) {
          setPhotos((prev) => prev.filter((p) => p.path !== photo.path));
        }
      } else {
        const data = await res.json();
        setError(data.error || "Operation failed.");
      }
    } catch {
      setError("Network error.");
    }
  }

  // ---- Sharing ----

  async function handleAddShare() {
    if (!shareEmail.trim() || !selectedAlbum) return;
    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails: [shareEmail.trim()] }),
      });
      if (res.ok) {
        setShareEmail("");
        await loadAlbumShares(selectedAlbum.id);
      }
    } catch {}
  }

  async function handleRevokeShare(email) {
    if (!selectedAlbum) return;
    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/shares`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setShares((prev) => prev.filter((s) => s.email !== email));
      }
    } catch {}
  }

  async function handleShareAll() {
    if (!selectedAlbum || !rsvpGuests.length) return;
    const emails = rsvpGuests.map((g) => g.email);
    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails }),
      });
      if (res.ok) await loadAlbumShares(selectedAlbum.id);
    } catch {}
  }

  // ---- Legacy migration ----

  async function handleMigrateLegacy() {
    if (!legacyTarget || !legacyPhotos.length) return;
    for (const photo of legacyPhotos) {
      try {
        // Use the old flat delete + re-upload isn't ideal.
        // Instead we'll download via signed URL and upload to the album.
        // But the simplest approach: call the move endpoint with the root path.
        // Unfortunately legacy photos don't have a "slug/" prefix.
        // We'll just re-upload them manually.
        const imgRes = await fetch(photo.url);
        if (!imgRes.ok) continue;
        const blob = await imgRes.blob();
        const formData = new FormData();
        formData.append("photos", blob, photo.name);
        await fetch(`/api/gallery/albums/${legacyTarget}/photos`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        // Delete from flat storage
        await fetch("/api/gallery/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ filename: photo.name }),
        });
      } catch {}
    }
    setLegacyPhotos([]);
    if (selectedAlbum?.id === legacyTarget) await loadAlbumPhotos(legacyTarget);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  // ---- Render ----

  if (loading) {
    return <main className={styles.host}><p className={styles.loading}>Loading...</p></main>;
  }

  if (loggedIn !== true) {
    return (
      <main className={styles.host}>
        <p className={styles.loading}>
          Please <a href="/dashboard" style={{ color: "var(--accent)" }}>go to dashboard</a>.
        </p>
      </main>
    );
  }

  // Album detail view
  if (selectedAlbum) {
    return (
      <main className={styles.host}>
        <div className={styles.header}>
          <div className={styles.breadcrumb}>
            <button className={styles.breadcrumbBack} onClick={() => { setSelectedAlbum(null); loadAlbums(); }}>
              Albums
            </button>
            <span className={styles.breadcrumbSep}>/</span>
            <h1 className={styles.title}>{selectedAlbum.name}</h1>
          </div>
          <div className={styles.headerActions}>
            <a href="/dashboard" className={styles.backLink}>Dashboard</a>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "photos" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("photos")}
          >
            Photos ({photos.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "sharing" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("sharing")}
          >
            Sharing ({shares.length})
          </button>
        </div>

        {activeTab === "photos" && (
          <>
            {/* Upload area */}
            <div
              className={`${styles.uploadCard} ${dragOver ? styles.dragOver : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <label className={styles.uploadLabel}>
                Choose Photos
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </label>
              <p className={styles.uploadHint}>or drag and drop images here</p>
              {uploadMsg && <p className={styles.uploadProgress}>{uploadMsg}</p>}
              {error && <p className={styles.feedback}>{error}</p>}
            </div>

            {loadingPhotos ? (
              <p className={styles.loading}>Loading photos...</p>
            ) : photos.length === 0 ? (
              <p className={styles.empty}>No photos in this album yet.</p>
            ) : (
              <div className={styles.photoGrid}>
                {photos.map((photo) => (
                  <div key={photo.path} className={styles.photoItem}>
                    <img src={photo.url} alt={photo.name} loading="lazy" />
                    <div className={styles.photoActions}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeletePhoto(photo)}
                        title="Delete"
                      >
                        x
                      </button>
                      <button
                        className={styles.moveBtn}
                        onClick={() => setMoveTarget({ photo, copy: false, targetAlbumId: "" })}
                        title="Move"
                      >
                        &#8594;
                      </button>
                      <button
                        className={styles.copyBtn}
                        onClick={() => setMoveTarget({ photo, copy: true, targetAlbumId: "" })}
                        title="Copy"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "sharing" && (
          <div className={styles.sharePanel}>
            <div className={styles.shareAddRow}>
              <select
                className={styles.shareSelect}
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              >
                <option value="">Select a guest...</option>
                {rsvpGuests
                  .filter((g) => !shares.find((s) => s.email.toLowerCase() === g.email.toLowerCase()))
                  .map((g) => (
                    <option key={g.email} value={g.email}>
                      {g.name} ({g.email})
                    </option>
                  ))}
              </select>
              <button className={styles.shareAddBtn} onClick={handleAddShare} disabled={!shareEmail}>
                Add
              </button>
              <button className={styles.shareAllBtn} onClick={handleShareAll}>
                Share with All
              </button>
            </div>

            {shares.length === 0 ? (
              <p className={styles.empty}>No guests have access to this album yet.</p>
            ) : (
              <div className={styles.shareList}>
                {shares.map((s) => (
                  <div key={s.email} className={styles.shareItem}>
                    <span>{s.email}</span>
                    <button className={styles.revokeBtn} onClick={() => handleRevokeShare(s.email)}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Move/Copy Modal */}
        {moveTarget && (
          <div className={styles.modal} onClick={() => setMoveTarget(null)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <h3>{moveTarget.copy ? "Copy" : "Move"} Photo</h3>
              <p className={styles.modalHint}>Select destination album:</p>
              <select
                className={styles.shareSelect}
                value={moveTarget.targetAlbumId}
                onChange={(e) => setMoveTarget({ ...moveTarget, targetAlbumId: e.target.value })}
              >
                <option value="">Select album...</option>
                {albums
                  .filter((a) => a.id !== selectedAlbum.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
              </select>
              <div className={styles.modalActions}>
                <button className={styles.backLink} onClick={() => setMoveTarget(null)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleMoveCopy}
                  disabled={!moveTarget.targetAlbumId}
                >
                  {moveTarget.copy ? "Copy" : "Move"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Albums list view
  return (
    <main className={styles.host}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Gallery</h1>
        <div className={styles.headerActions}>
          <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
            + New Album
          </button>
          <a href="/dashboard" className={styles.backLink}>Dashboard</a>
        </div>
      </div>

      {error && <p className={styles.feedback}>{error}</p>}

      {/* Legacy photos banner */}
      {legacyPhotos.length > 0 && (
        <div className={styles.legacyBanner}>
          <p>
            <strong>{legacyPhotos.length} photo{legacyPhotos.length !== 1 ? "s" : ""}</strong> exist outside any album.
            Move them to an album to make them visible to guests.
          </p>
          {albums.length > 0 && (
            <div className={styles.legacyActions}>
              <select
                className={styles.shareSelect}
                value={legacyTarget}
                onChange={(e) => setLegacyTarget(e.target.value)}
              >
                <option value="">Select album...</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <button
                className={styles.submitBtn}
                onClick={handleMigrateLegacy}
                disabled={!legacyTarget}
              >
                Move All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create album modal */}
      {showCreate && (
        <div className={styles.modal} onClick={() => setShowCreate(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Create Album</h3>
            <form onSubmit={handleCreateAlbum}>
              <input
                type="text"
                className={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Album name"
                maxLength={100}
                autoFocus
                required
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.backLink} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {renameTarget && (
        <div className={styles.modal} onClick={() => setRenameTarget(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Rename Album</h3>
            <form onSubmit={handleRenameAlbum}>
              <input
                type="text"
                className={styles.input}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="New name"
                maxLength={100}
                autoFocus
                required
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.backLink} onClick={() => setRenameTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>Rename</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Album grid */}
      {albums.length === 0 ? (
        <p className={styles.empty}>No albums yet. Create one to get started!</p>
      ) : (
        <div className={styles.albumGrid}>
          {albums.map((album) => (
            <div key={album.id} className={styles.albumCard} onClick={() => openAlbum(album)}>
              <h3 className={styles.albumName}>{album.name}</h3>
              <p className={styles.albumStat}>
                {album.share_count} guest{album.share_count !== 1 ? "s" : ""}
              </p>
              <div className={styles.albumCardActions} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.albumEditBtn}
                  onClick={() => { setRenameTarget(album); setRenameValue(album.name); }}
                >
                  Rename
                </button>
                <button className={styles.albumDeleteBtn} onClick={() => handleDeleteAlbum(album)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
