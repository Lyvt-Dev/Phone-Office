package dev.lyvt.phoneoffice;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.HashSet;

/** Reads only the export tree explicitly granted through Android's system picker. */
@CapacitorPlugin(name = "NotesFolder")
public class NotesFolderPlugin extends Plugin {
    private SharedPreferences prefs() { return getContext().getSharedPreferences("notes-export-folder", 0); }
    @PluginMethod public void choose(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "folderChosen");
    }
    @ActivityCallback private void folderChosen(PluginCall call, androidx.activity.result.ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve(new JSObject().put("cancelled", true)); return;
        }
        try {
            Uri uri = data.getData();
            getContext().getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            String old = prefs().getString("uri", null);
            prefs().edit().putString("uri", uri.toString()).apply();
            if (old != null && !old.equals(uri.toString())) release(Uri.parse(old));
            call.resolve(new JSObject().put("connected", true));
        } catch (Exception e) { call.reject("Ordnerfreigabe nicht möglich. Bitte einen lokalen Exportordner auswählen."); }
    }
    private void release(Uri uri) {
        try { getContext().getContentResolver().releasePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (SecurityException ignored) {}
    }
    @PluginMethod public void disconnect(PluginCall call) {
        String raw = prefs().getString("uri", null);
        if (raw != null) release(Uri.parse(raw));
        prefs().edit().remove("uri").apply(); call.resolve();
    }
    @PluginMethod public void scan(PluginCall call) {
        getBridge().execute(() -> {
            String raw = prefs().getString("uri", null);
            if (raw == null) { call.resolve(new JSObject().put("connected", false).put("files", new JSArray())); return; }
            try {
                Uri tree = Uri.parse(raw);
                ArrayDeque<String> queue = new ArrayDeque<>();
                queue.add(DocumentsContract.getTreeDocumentId(tree));
                HashSet<String> visited = new HashSet<>(); JSArray files = new JSArray();
                int count = 0;
                while (!queue.isEmpty() && count < 5000) {
                    String parent = queue.remove();
                    if (!visited.add(parent)) continue;
                    Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, parent);
                    String[] fields = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                        DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_SIZE, DocumentsContract.Document.COLUMN_LAST_MODIFIED};
                    try (Cursor cursor = getContext().getContentResolver().query(children, fields, null, null, null)) {
                        if (cursor == null) continue;
                        while (cursor.moveToNext() && count++ < 5000) {
                            String id = cursor.getString(0), name = cursor.getString(1), mime = cursor.getString(2);
                            if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) { queue.add(id); continue; }
                            if (name == null || !(name.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf") || name.toLowerCase(java.util.Locale.ROOT).endsWith(".pnote"))) continue;
                            long size = cursor.isNull(3) ? -1 : cursor.getLong(3), modified = cursor.isNull(4) ? 0 : cursor.getLong(4);
                            files.put(new JSObject().put("id", id).put("name", name).put("size", size).put("modified", modified));
                        }
                    }
                }
                call.resolve(new JSObject().put("connected", true).put("files", files).put("truncated", count >= 5000).put("scope", raw));
            } catch (Exception e) { call.reject("Exportordner nicht erreichbar. Ordner erneut freigeben."); }
        });
    }
    @PluginMethod public void read(PluginCall call) {
        getBridge().execute(() -> {
            String raw = prefs().getString("uri", null), id = call.getString("id");
            if (raw == null || id == null) { call.reject("Kein freigegebener Exportordner."); return; }
            try {
                Uri tree = Uri.parse(raw), root = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
                Uri target = DocumentsContract.buildDocumentUriUsingTree(tree, id);
                if (!target.equals(root) && !DocumentsContract.isChildDocument(getContext().getContentResolver(), root, target)) {
                    call.reject("Datei liegt außerhalb des freigegebenen Ordners."); return;
                }
                try (InputStream in = getContext().getContentResolver().openInputStream(target); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
                    if (in == null) throw new IllegalStateException();
                    byte[] buffer = new byte[16384]; int n;
                    while ((n = in.read(buffer)) != -1) {
                        if (bytes.size() + n > 20 * 1024 * 1024) { call.reject("Datei ist zu groß (maximal 20 MB)."); return; }
                        bytes.write(buffer, 0, n);
                    }
                    call.resolve(new JSObject().put("data", Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)));
                }
            } catch (Exception e) { call.reject("Exportdatei konnte nicht gelesen werden."); }
        });
    }
}
