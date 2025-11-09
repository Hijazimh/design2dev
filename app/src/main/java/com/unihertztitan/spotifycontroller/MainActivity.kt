package com.unihertztitan.spotifycontroller

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.spotify.protocol.types.PlayerState
import com.unihertztitan.spotifycontroller.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity(), SpotifyController.Listener {

    private lateinit var binding: ActivityMainBinding
    private lateinit var spotifyController: SpotifyController
    private lateinit var subscreenManager: TitanSubscreenManager

    private var isConnected = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        spotifyController = SpotifyController(this)
        spotifyController.registerListener(this)

        subscreenManager = TitanSubscreenManager(this, spotifyController) { available ->
            binding.subscreenStatus.text = if (available) {
                getString(R.string.subscreen_status_ready)
            } else {
                getString(R.string.subscreen_status_waiting)
            }
        }

        setupUi()
    }

    private fun setupUi() {
        binding.connectionStatus.text = getString(R.string.not_connected)
        setPlaybackControlsEnabled(false)

        binding.connectButton.setOnClickListener {
            if (isConnected) {
                spotifyController.disconnect()
            } else {
                binding.connectionStatus.text = getString(R.string.connecting)
                spotifyController.connect(force = true)
            }
        }

        binding.playPauseButton.setOnClickListener { spotifyController.togglePlayPause() }
        binding.nextButton.setOnClickListener { spotifyController.skipNext() }
        binding.previousButton.setOnClickListener { spotifyController.skipPrevious() }
    }

    override fun onStart() {
        super.onStart()
        spotifyController.connect()
    }

    override fun onStop() {
        spotifyController.disconnect()
        super.onStop()
    }

    override fun onDestroy() {
        spotifyController.unregisterListener(this)
        subscreenManager.destroy()
        super.onDestroy()
    }

    override fun onConnectionChanged(connected: Boolean) {
        isConnected = connected
        binding.connectionStatus.text = getString(
            if (connected) R.string.connected else R.string.not_connected
        )
        binding.connectButton.text = getString(
            if (connected) R.string.disconnect_spotify else R.string.connect_spotify
        )
        setPlaybackControlsEnabled(connected)
    }

    override fun onPlayerStateChanged(state: PlayerState?) {
        binding.trackTitle.text = state?.track?.name.orEmpty()
        binding.trackArtist.text = state?.track?.artist?.name.orEmpty()
        binding.playPauseButton.text = getString(
            if (state?.isPaused == true) R.string.play else R.string.pause
        )
    }

    private fun setPlaybackControlsEnabled(enabled: Boolean) {
        binding.playPauseButton.isEnabled = enabled
        binding.nextButton.isEnabled = enabled
        binding.previousButton.isEnabled = enabled
    }
}
