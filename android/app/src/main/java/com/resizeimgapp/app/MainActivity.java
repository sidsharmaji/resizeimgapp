package com.resizeimgapp.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    private static final String INITIAL_URL = "file:///android_asset/public/index.html";
    private WebView webView;
    private String downloadUrl;
    private String downloadMimeType;
    private long downloadContentLength;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request necessary permissions at startup
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            String[] permissions = {
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
                android.Manifest.permission.READ_EXTERNAL_STORAGE,
                android.Manifest.permission.CAMERA,
                android.Manifest.permission.READ_MEDIA_IMAGES
            };
            requestPermissions(permissions, 1001);
        }
        
        // Get WebView and configure settings
        webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        
        // Enable JavaScript and other essential features
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDomStorageEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Enable viewport and rendering optimizations
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
        
        // Enable cache and database
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDatabaseEnabled(true);
        
        // Enable local file access with security measures
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        
        // Disable zoom for better UX
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        
        // Enable debugging in development
        android.webkit.WebView.setWebContentsDebuggingEnabled(true);

        // Configure download listener
        webView.setDownloadListener(new android.webkit.DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                      String mimeType, long contentLength) {
                downloadUrl = url;
                downloadMimeType = mimeType;
                downloadContentLength = contentLength;

                // Request storage permission if needed
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    if (checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                            != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE},
                                1001);
                        return;
                    }
                }
                startDownload();
            }
        });

        // Configure WebViewClient with enhanced error handling
        webView.setWebViewClient(new android.webkit.WebViewClient() {
            @Override
            public void onReceivedError(WebView view, android.webkit.WebResourceRequest request, android.webkit.WebResourceError error) {
                super.onReceivedError(view, request, error);
                android.util.Log.e("MainActivity", "WebView error: " + error.getDescription() + ", URL: " + request.getUrl() + ", Code: " + error.getErrorCode());
                
                // Handle specific error cases
                if (error.getErrorCode() == ERROR_HOST_LOOKUP || error.getErrorCode() == ERROR_CONNECT || error.getErrorCode() == ERROR_TIMEOUT) {
                    // Network-related errors - retry loading
                    view.postDelayed(() -> loadInitialUrl(), 1000);
                } else {
                    // Other errors - reload initial URL
                    loadInitialUrl();
                }
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                android.util.Log.d("MainActivity", "Page loading started: " + url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                android.util.Log.d("MainActivity", "Page loaded successfully: " + url);
                
                // Ensure content is visible
                view.setVisibility(View.VISIBLE);
            }
        });

        // Clear existing data for fresh start
        clearWebViewData();

        // Initial load with retry mechanism
        loadInitialUrl();
    }

    private void clearWebViewData() {
        webView.clearCache(true);
        webView.clearHistory();
        android.webkit.CookieManager.getInstance().removeAllCookies(null);
        android.webkit.CookieManager.getInstance().flush();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                         int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 1001) {
            boolean allPermissionsGranted = true;
            for (int result : grantResults) {
                if (result != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            
            if (allPermissionsGranted) {
                // All permissions granted, proceed with download if pending
                if (downloadUrl != null) {
                    startDownload();
                }
            } else {
                // Show dialog explaining why permissions are needed
                new android.app.AlertDialog.Builder(this)
                    .setTitle("Permissions Required")
                    .setMessage("This app needs storage permissions to save images and files. Please grant the permissions in Settings.")
                    .setPositiveButton("Open Settings", (dialog, which) -> {
                        android.content.Intent intent = new android.content.Intent(
                            android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                            android.net.Uri.fromParts("package", getPackageName(), null));
                        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            }
        }
        }

    private void startDownload() {
        try {
            // Create download request
            android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(android.net.Uri.parse(downloadUrl));
            request.setMimeType(downloadMimeType);
            request.setTitle("Downloading file");
            request.setDescription("File is being downloaded...");
            request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

            // Generate unique filename
            String fileName = "download_" + System.currentTimeMillis();
            String fileExtension = android.webkit.MimeTypeMap.getSingleton().getExtensionFromMimeType(downloadMimeType);
            if (fileExtension == null) {
                fileExtension = downloadMimeType.contains("/") ? downloadMimeType.split("/")[1] : "bin";
            }
            fileName = fileName + "." + fileExtension;

            // Set destination
            request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName);

            // Start download
            android.app.DownloadManager dm = (android.app.DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            final long downloadId = dm.enqueue(request);

            // Register broadcast receiver to track download completion
            registerReceiver(new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(android.content.Context context, android.content.Intent intent) {
                    long id = intent.getLongExtra(android.app.DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (downloadId == id) {
                        android.widget.Toast.makeText(getApplicationContext(), 
                            "Download completed", android.widget.Toast.LENGTH_SHORT).show();
                        unregisterReceiver(this);
                    }
                }
            }, new android.content.IntentFilter(android.app.DownloadManager.ACTION_DOWNLOAD_COMPLETE));

            android.widget.Toast.makeText(getApplicationContext(), "Starting download...", android.widget.Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Download error: " + e.getMessage());
            android.widget.Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(),
                    android.widget.Toast.LENGTH_LONG).show();
        }
    }

    private void loadInitialUrl() {
        try {
            // Ensure WebView is visible
            webView.setVisibility(View.VISIBLE);
            
            // Add a delay before loading to ensure WebView is ready
            webView.postDelayed(() -> {
                // Check if assets exist
                try {
                    String[] files = getAssets().list("public");
                    if (files != null && files.length > 0) {
                        webView.loadUrl(INITIAL_URL);
                    } else {
                        android.util.Log.e("MainActivity", "No files found in assets/public directory");
                        // Handle missing files
                        webView.loadData("<html><body><h1>Error loading content</h1><p>Please reinstall the application.</p></body></html>", "text/html", "UTF-8");
                    }
                } catch (Exception e) {
                    android.util.Log.e("MainActivity", "Error checking assets: " + e.getMessage());
                    webView.loadData("<html><body><h1>Error loading content</h1><p>" + e.getMessage() + "</p></body></html>", "text/html", "UTF-8");
                }
            }, 500); // 500ms delay
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error in loadInitialUrl: " + e.getMessage());
        }
        
        // Backup load after delay if needed
        webView.postDelayed(() -> {
            if (webView.getProgress() < 100) {
                webView.loadUrl(INITIAL_URL);
            }
        }, 2000);
        
        // Backup load after delay if needed
        webView.postDelayed(() -> {
            if (webView.getProgress() < 100) {
                webView.loadUrl(INITIAL_URL);
            }
        }, 2000);
    }
}