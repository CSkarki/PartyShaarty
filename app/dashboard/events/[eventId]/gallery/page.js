"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import galleryStyles from "../../../gallery/page.module.css";

export default function EventGalleryPage() {
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [activeTab, setActiveTab] = useState("photos");
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const [shares, setShares] = useState([]);
  const [rsvpGuests, setRsvpGuests] = useState([]);
  const [shareEmail, setShareEmail] = useState("");

  const [moveTarget, setMoveTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [error, setError] = useState("");

  const opts = { credentials: "include" };

  useEffect(() => {
    Promise.all([loadAlbums(), loadRsvpGuests()]).finally(() => setLoading(false));
  }, [eventId]);

  async function loadAlbums() {
    try {
      const res = await fetch(`/api/gallery/albums?eventId=${eventId}`, opts);
      if (res.ok) setAlbums(await res.json());
    } catch {}
  }

  async function loadRsvpGuests() {
    try {
      const res = await fetch(`/api/rsvp/list?eventId=${eventId}`, opts);
      if (res.ok) {
        const data = await res.json();
        const attending = (Array.isArray(data) ? data : []).filter(
          (r) => r.attending?.toLowerCase() === "yes"
        );
        setRsvpGuests(attending);
      }
    } catch {}
  }

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
        body: JSON.stringify({ name: newName.trim(), eventId }),
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
        if (!copy) setPhotos((prev) => prev.filter((p) => p.path !== photo.path));
      } else {
        const data = await res.json();
        setError(data.error || "Operation failed.");
      }
    } catch {
      setError("Network error.");
    }
  }

  async function handleAddShare() {
    if (!shareEmail.trim() || !selectedAlbum) return;
    try {
      const res = await fetch(`/api/gallery/albums/${selectedAlbum.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails: [shareEmail.trim()] }),
      });
      if (res.ok) { setShareEmail(""); await loadAlbumShares(selectedAlbum.id); }
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
      if (res.ok) setShares((prev) => prev.filter((s) => s.email !== email));
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

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  if (loading) {
    return <main className={galleryStyles.host}><p className={galleryStyles.loading}>Loading...</p></main>;
  }

  // Album detail view
  if (selectedAlbum) {
    return (
      <main className={galleryStyles.host}>
        <div className={galleryStyles.header}>
          <div className={galleryStyles.breadcrumb}>
            <button className={galleryStyles.breadcrumbBack} onClick={() => { setSelectedAlbum(null); loadAlbums(); }}>
              Albums
            </button>
            <span className={galleryStyles.breadcrumbSep}>/</span>
            <h1 className={galleryStyles.title}>{selectedAlbum.name}</h1>
          </div>
          <div className={galleryStyles.headerActions}>
            <a href={`/dashboard/events/${eventId}`} className={galleryStyles.backLink}>← Event Dashboard</a>
          </div>
        </div>

        <div className={galleryStyles.tabs}>
          <button
            className={`${galleryStyles.tab} ${activeTab === "photos" ? galleryStyles.tabActive : ""}`}
            onClick={() => setActiveTab("photos")}
          >
            Photos ({photos.length})
          </button>
          <button
            className={`${galleryStyles.tab} ${activeTab === "sharing" ? galleryStyles.tabActive : ""}`}
            onClick={() => setActiveTab("sharing")}
          >
            Sharing ({shares.length})
          </button>
        </div>

        {activeTab === "photos" && (
          <>
            <div
              className={`${galleryStyles.uploadCard} ${dragOver ? galleryStyles.dragOver : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <label className={galleryStyles.uploadLabel}>
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
              <p className={galleryStyles.uploadHint}>or drag and drop images here</p>
              {uploadMsg && <p className={galleryStyles.uploadProgress}>{uploadMsg}</p>}
              {error && <p className={galleryStyles.feedback}>{error}</p>}
            </div>

            {loadingPhotos ? (
              <p className={galleryStyles.loading}>Loading photos...</p>
            ) : photos.length === 0 ? (
              <p className={galleryStyles.empty}>No photos in this album yet.</p>
            ) : (
              <div className={galleryStyles.photoGrid}>
                {photos.map((photo) => (
                  <div key={photo.path} className={galleryStyles.photoItem}>
                    <img src={photo.url} alt={photo.name} loading="lazy" />
                    <div className={galleryStyles.photoActions}>
                      <button className={galleryStyles.deleteBtn} onClick={() => handleDeletePhoto(photo)} title="Delete">x</button>
                      <button className={galleryStyles.moveBtn} onClick={() => setMoveTarget({ photo, copy: false, targetAlbumId: "" })} title="Move">&#8594;</button>
                      <button className={galleryStyles.copyBtn} onClick={() => setMoveTarget({ photo, copy: true, targetAlbumId: "" })} title="Copy">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "sharing" && (
          <div className={galleryStyles.sharePanel}>
            <div className={galleryStyles.shareAddRow}>
              <select
                className={galleryStyles.shareSelect}
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              >
                <option value="">Select a guest...</option>
                {rsvpGuests
                  .filter((g) => !shares.find((s) => s.email.toLowerCase() === g.email.toLowerCase()))
                  .map((g) => (
                    <option key={g.email} value={g.email}>{g.name} ({g.email})</option>
                  ))}
              </select>
              <button className={galleryStyles.shareAddBtn} onClick={handleAddShare} disabled={!shareEmail}>Add</button>
              <button className={galleryStyles.shareAllBtn} onClick={handleShareAll}>Share with All</button>
            </div>

            {shares.length === 0 ? (
              <p className={galleryStyles.empty}>No guests have access to this album yet.</p>
            ) : (
              <div className={galleryStyles.shareList}>
                {shares.map((s) => (
                  <div key={s.email} className={galleryStyles.shareItem}>
                    <span>{s.email}</span>
                    <button className={galleryStyles.revokeBtn} onClick={() => handleRevokeShare(s.email)}>Revoke</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {moveTarget && (
          <div className={galleryStyles.modal} onClick={() => setMoveTarget(null)}>
            <div className={galleryStyles.modalCard} onClick={(e) => e.stopPropagation()}>
              <h3>{moveTarget.copy ? "Copy" : "Move"} Photo</h3>
              <p className={galleryStyles.modalHint}>Select destination album:</p>
              <select
                className={galleryStyles.shareSelect}
                value={moveTarget.targetAlbumId}
                onChange={(e) => setMoveTarget({ ...moveTarget, targetAlbumId: e.target.value })}
              >
                <option value="">Select album...</option>
                {albums
                  .filter((a) => a.id !== selectedAlbum.id)
                  .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className={galleryStyles.modalActions}>
                <button className={galleryStyles.backLink} onClick={() => setMoveTarget(null)}>Cancel</button>
                <button className={galleryStyles.submitBtn} onClick={handleMoveCopy} disabled={!moveTarget.targetAlbumId}>
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
    <main className={galleryStyles.host}>
      <div className={galleryStyles.header}>
        <h1 className={galleryStyles.title}>Photo Gallery</h1>
        <div className={galleryStyles.headerActions}>
          <button className={galleryStyles.createBtn} onClick={() => setShowCreate(true)}>+ New Album</button>
          <a href={`/dashboard/events/${eventId}`} className={galleryStyles.backLink}>← Event Dashboard</a>
        </div>
      </div>

      {error && <p className={galleryStyles.feedback}>{error}</p>}

      {showCreate && (
        <div className={galleryStyles.modal} onClick={() => setShowCreate(false)}>
          <div className={galleryStyles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Create Album</h3>
            <form onSubmit={handleCreateAlbum}>
              <input
                type="text"
                className={galleryStyles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Album name"
                maxLength={100}
                autoFocus
                required
              />
              <div className={galleryStyles.modalActions}>
                <button type="button" className={galleryStyles.backLink} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className={galleryStyles.submitBtn} disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className={galleryStyles.modal} onClick={() => setRenameTarget(null)}>
          <div className={galleryStyles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Rename Album</h3>
            <form onSubmit={handleRenameAlbum}>
              <input
                type="text"
                className={galleryStyles.input}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="New name"
                maxLength={100}
                autoFocus
                required
              />
              <div className={galleryStyles.modalActions}>
                <button type="button" className={galleryStyles.backLink} onClick={() => setRenameTarget(null)}>Cancel</button>
                <button type="submit" className={galleryStyles.submitBtn}>Rename</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {albums.length === 0 ? (
        <p className={galleryStyles.empty}>No albums yet. Create one to get started!</p>
      ) : (
        <div className={galleryStyles.albumGrid}>
          {albums.map((album) => (
            <div key={album.id} className={galleryStyles.albumCard} onClick={() => openAlbum(album)}>
              <h3 className={galleryStyles.albumName}>{album.name}</h3>
              <p className={galleryStyles.albumStat}>
                {album.share_count} guest{album.share_count !== 1 ? "s" : ""}
              </p>
              <div className={galleryStyles.albumCardActions} onClick={(e) => e.stopPropagation()}>
                <button
                  className={galleryStyles.albumEditBtn}
                  onClick={() => { setRenameTarget(album); setRenameValue(album.name); }}
                >
                  Rename
                </button>
                <button className={galleryStyles.albumDeleteBtn} onClick={() => handleDeleteAlbum(album)}>
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
