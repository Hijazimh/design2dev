package com.unihertztitan.spotifycontroller

import android.content.Context
import android.hardware.display.DisplayManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Display

class TitanSubscreenManager(
    private val context: Context,
    private val spotifyController: SpotifyController,
    private val onPresentationStatus: (Boolean) -> Unit
) : DisplayManager.DisplayListener {

    private val displayManager: DisplayManager =
        context.getSystemService(DisplayManager::class.java)
    private val handler = Handler(Looper.getMainLooper())
    private var presentation: TitanSubscreenPresentation? = null

    init {
        displayManager.registerDisplayListener(this, handler)
        ensurePresentation()
    }

    private fun ensurePresentation() {
        if (presentation?.isShowing == true) {
            return
        }

        val targetDisplay = findRearDisplay() ?: run {
            onPresentationStatus(false)
            return
        }

        presentation = TitanSubscreenPresentation(context, targetDisplay).also {
            it.show()
            it.bindSpotifyController(spotifyController)
            onPresentationStatus(true)
            Log.d(TAG, "Subscreen presentation attached to display ${targetDisplay.displayId}")
        }
    }

    private fun findRearDisplay(): Display? {
        val candidates = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
        if (candidates.isEmpty()) {
            Log.d(TAG, "No presentation displays detected")
            return null
        }
        return candidates.firstOrNull { display ->
            display.displayId != Display.DEFAULT_DISPLAY &&
                display.name.contains("rear", ignoreCase = true)
        } ?: candidates.firstOrNull()
    }

    override fun onDisplayAdded(displayId: Int) {
        handler.post { ensurePresentation() }
    }

    override fun onDisplayChanged(displayId: Int) {
        // No-op
    }

    override fun onDisplayRemoved(displayId: Int) {
        if (presentation?.display?.displayId == displayId) {
            handler.post {
                presentation?.dismiss()
                presentation = null
                onPresentationStatus(false)
                Log.d(TAG, "Rear display removed: $displayId")
            }
        }
    }

    fun destroy() {
        presentation?.dismiss()
        presentation = null
        displayManager.unregisterDisplayListener(this)
        onPresentationStatus(false)
    }

    companion object {
        private const val TAG = "TitanSubscreenMgr"
    }
}
