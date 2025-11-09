package com.unihertztitan.spotifycontroller

import android.app.Presentation
import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Display
import android.widget.Button
import android.widget.TextView
import com.spotify.protocol.types.PlayerState

class TitanSubscreenPresentation(
    outerContext: Context,
    display: Display
) : Presentation(outerContext, display), SpotifyController.Listener {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var controller: SpotifyController? = null

    private lateinit var statusView: TextView
    private lateinit var titleView: TextView
    private lateinit var artistView: TextView
    private lateinit var playPauseButton: Button
    private lateinit var nextButton: Button
    private lateinit var prevButton: Button

    private var lastState: PlayerState? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.presentation_subscreen)
        statusView = findViewById(R.id.presentationStatus)
        titleView = findViewById(R.id.presentationTrackTitle)
        artistView = findViewById(R.id.presentationTrackArtist)
        playPauseButton = findViewById(R.id.presentationPlayPauseButton)
        nextButton = findViewById(R.id.presentationNextButton)
        prevButton = findViewById(R.id.presentationPrevButton)

        playPauseButton.setOnClickListener { controller?.togglePlayPause() }
        nextButton.setOnClickListener { controller?.skipNext() }
        prevButton.setOnClickListener { controller?.skipPrevious() }
        refreshPlaybackButtons(isConnected = false)
    }

    fun bindSpotifyController(spotifyController: SpotifyController) {
        controller?.unregisterListener(this)
        controller = spotifyController
        controller?.registerListener(this)
    }

    override fun onStop() {
        controller?.unregisterListener(this)
        super.onStop()
    }

    override fun onConnectionChanged(connected: Boolean) {
        mainHandler.post {
            statusView.text = if (connected) {
                context.getString(R.string.connected)
            } else {
                context.getString(R.string.not_connected)
            }
            refreshPlaybackButtons(connected)
        }
    }

    override fun onPlayerStateChanged(state: PlayerState?) {
        lastState = state
        mainHandler.post {
            titleView.text = state?.track?.name.orEmpty()
            artistView.text = state?.track?.artist?.name.orEmpty()
            playPauseButton.text = context.getString(
                if (state?.isPaused == true) R.string.play else R.string.pause
            )
        }
    }

    private fun refreshPlaybackButtons(isConnected: Boolean) {
        playPauseButton.isEnabled = isConnected
        nextButton.isEnabled = isConnected
        prevButton.isEnabled = isConnected
    }
}
