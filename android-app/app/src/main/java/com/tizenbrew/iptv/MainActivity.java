package com.tizenbrew.iptv;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;
import org.json.JSONArray;
import org.json.JSONObject;

@UnstableApi
public class MainActivity extends Activity {
    private WebView webView;
    private ExoPlayer player;
    private SurfaceView surfaceView;

    private final Player.Listener playerListener = new Player.Listener() {
        @Override public void onPlaybackStateChanged(int state) {
            if (state == Player.STATE_READY)
                js("window._onNativeReady && window._onNativeReady()");
            else if (state == Player.STATE_ENDED)
                js("window._onNativeEnded && window._onNativeEnded()");
        }
        @Override public void onPlayerError(@NonNull PlaybackException e) {
            js("window._onNativeError && window._onNativeError('" + esc(e.getMessage()) + "')");
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);

        surfaceView = new SurfaceView(this);
        surfaceView.getHolder().setKeepScreenOn(true);
        root.addView(surfaceView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(root);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new PlayerBridge(), "NativePlayer");
        webView.loadUrl("file:///android_asset/index.html");
        hideSystemUI();
        startUpdateCheck();
    }

    private void ensurePlayer() {
        if (player == null) {
            DefaultLoadControl loadControl = new DefaultLoadControl.Builder()
                .setBufferDurationsMs(15000, 30000, 1500, 3000)
                .setPrioritizeTimeOverSizeThresholds(true)
                .build();
            player = new ExoPlayer.Builder(this)
                .setLoadControl(loadControl)
                .build();
            player.setVideoSurfaceView(surfaceView);
            player.addListener(playerListener);
        }
        surfaceView.setVisibility(View.VISIBLE);
    }

    private void startPlayback(String url) {
        ensurePlayer();
        try {
            player.setMediaItem(MediaItem.fromUri(Uri.parse(url)));
            player.prepare();
            player.play();
        } catch (Exception e) {
            js("window._onNativeError && window._onNativeError('playback error: " + esc(e.getMessage()) + "')");
        }
    }

    private void releasePlayer() {
        if (player != null) {
            player.removeListener(playerListener);
            player.release();
            player = null;
        }
        surfaceView.setVisibility(View.GONE);
    }

    private void js(String code) {
        webView.evaluateJavascript(code, null);
    }

    private static String esc(String s) {
        return s == null ? "unknown" : s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
    }

    private void startUpdateCheck() {
        new Thread(() -> {
            try {
                URL apiUrl = new URL("https://api.github.com/repos/thichcode/iptv-qr/releases/latest");
                HttpURLConnection conn = (HttpURLConnection) apiUrl.openConnection();
                conn.setRequestProperty("User-Agent", "IPTV-AndroidTV");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                if (conn.getResponseCode() != 200) return;

                InputStream is = conn.getInputStream();
                Scanner s = new Scanner(is).useDelimiter("\\A");
                String resp = s.hasNext() ? s.next() : "";
                s.close();

                JSONObject release = new JSONObject(resp);
                String tagName = release.optString("tag_name", "");
                if (tagName.isEmpty()) return;

                String currentVersion = "";
                try {
                    currentVersion = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
                } catch (Exception ignored) {}

                if (!currentVersion.isEmpty()) {
                    String normalizedTag = tagName.startsWith("v") ? tagName.substring(1) : tagName;
                    String normalizedCur = currentVersion.startsWith("v") ? currentVersion.substring(1) : currentVersion;
                    if (normalizedTag.equalsIgnoreCase(normalizedCur)) {
                        return;
                    }
                }

                JSONArray assets = release.optJSONArray("assets");
                if (assets == null) return;
                String downloadUrl = null;
                for (int i = 0; i < assets.length(); i++) {
                    JSONObject asset = assets.getJSONObject(i);
                    String name = asset.optString("name", "");
                    if (name.endsWith(".apk")) {
                        downloadUrl = asset.optString("browser_download_url", null);
                        break;
                    }
                }
                if (downloadUrl == null) return;

                final String finalTag = tagName;
                runOnUiThread(() -> js("window._onUpdateStatus && window._onUpdateStatus('Found update " + esc(finalTag) + ", downloading...')"));

                File apkFile = new File(getExternalFilesDir(null), "update.apk");
                URL apkUrl = new URL(downloadUrl);
                HttpURLConnection dlConn = (HttpURLConnection) apkUrl.openConnection();
                dlConn.setRequestProperty("User-Agent", "IPTV-AndroidTV");
                dlConn.setInstanceFollowRedirects(true);
                dlConn.setConnectTimeout(15000);
                dlConn.setReadTimeout(30000);

                int status = dlConn.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                    String newUrl = dlConn.getHeaderField("Location");
                    if (newUrl != null && !newUrl.isEmpty()) {
                        dlConn = (HttpURLConnection) new URL(newUrl).openConnection();
                        dlConn.setRequestProperty("User-Agent", "IPTV-AndroidTV");
                    }
                }

                InputStream in = dlConn.getInputStream();
                FileOutputStream out = new FileOutputStream(apkFile);
                byte[] buffer = new byte[8192];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    out.write(buffer, 0, len);
                }
                out.flush();
                out.close();
                in.close();

                runOnUiThread(() -> {
                    js("window._onUpdateStatus && window._onUpdateStatus('Update ready to install')");
                    installApk(apkFile);
                });
            } catch (Exception e) {
                // Silent ignore on auto-update check failure
            }
        }).start();
    }

    private void installApk(File apkFile) {
        try {
            if (!apkFile.exists()) return;
            Uri apkUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apkFile);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            js("window._onUpdateStatus && window._onUpdateStatus('Install error: " + esc(e.getMessage()) + "')");
        }
    }

    public class PlayerBridge {
        @JavascriptInterface public void play(String url) { runOnUiThread(() -> startPlayback(url)); }
        @JavascriptInterface public void pause() { runOnUiThread(() -> { if (player != null) player.pause(); }); }
        @JavascriptInterface public void resume() { runOnUiThread(() -> { if (player != null) player.play(); }); }
        @JavascriptInterface public void stop() { runOnUiThread(() -> releasePlayer()); }
        @JavascriptInterface public boolean isPlaying() { return player != null && player.isPlaying(); }
        @JavascriptInterface public void seek(long ms) { runOnUiThread(() -> {
            if (player != null) player.seekTo(Math.max(0, player.getCurrentPosition() + ms));
        }); }
        @JavascriptInterface public long getPosition() { return player != null ? player.getCurrentPosition() : 0; }
        @JavascriptInterface public long getDuration() { return player != null ? player.getDuration() : -1; }
        @JavascriptInterface public void setVolume(float delta) { runOnUiThread(() -> {
            if (player != null) player.setVolume(Math.max(0f, Math.min(1f, player.getVolume() + delta)));
        }); }
        @JavascriptInterface public void setSpeed(float speed) { runOnUiThread(() -> {
            if (player != null) player.setPlaybackSpeed(speed);
        }); }
        @JavascriptInterface public void checkForUpdates() { startUpdateCheck(); }
    }

    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) { hideSystemUI(); }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) { webView.goBack(); } else { super.onBackPressed(); }
    }

    @Override
    protected void onDestroy() {
        releasePlayer();
        super.onDestroy();
    }
}
