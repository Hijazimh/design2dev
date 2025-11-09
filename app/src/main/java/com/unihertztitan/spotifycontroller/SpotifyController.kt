package com.unihertztitan.spotifycontroller

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import com.spotify.android.appremote.api.error.SpotifyAppRemoteException
import com.spotify.protocol.client.Subscription
import com.spotify.protocol.types.PlayerState

class SpotifyController(private val context: Context) {

    interface Listener {
        fun onConnectionChanged(connected: Boolean)
        fun onPlayerStateChanged(state: PlayerState?)
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val listeners = mutableSetOf<Listener>()
    private var spotifyAppRemote: SpotifyAppRemote? = null
    private var playerStateSubscription: Subscription<PlayerState>? = null
    private var lastPlayerState: PlayerState? = null
    private var isConnecting: Boolean = false

    fun registerListener(listener: Listener) {
        listeners.add(listener)
        listener.onConnectionChanged(isConnected())
        listener.onPlayerStateChanged(lastPlayerState)
    }

    fun unregisterListener(listener: Listener) {
        listeners.remove(listener)
    }

    fun isConnected(): Boolean = spotifyAppRemote != null

    fun connect(force: Boolean = false) {
        if (isConnecting) return
        if (isConnected() && !force) return

        val clientId = context.getString(R.string.spotify_client_id)
        val redirectUri = buildRedirectUri()

        if (clientId.isBlank() || clientId == PLACEHOLDER_CLIENT_ID) {
            Log.w(TAG, "Spotify client ID is not configured. Update strings.xml.")
            notifyConnectionChanged(false)
            return
        }

        isConnecting = true

        val connectionParams = ConnectionParams.Builder(clientId)
            .setRedirectUri(redirectUri)
            .showAuthView(true)
            .build()

        SpotifyAppRemote.connect(context, connectionParams, object : Connector.ConnectionListener {
            override fun onConnected(appRemote: SpotifyAppRemote) {
                spotifyAppRemote = appRemote
                isConnecting = false
                startPlayerStateSubscription()
                notifyConnectionChanged(true)
            }

            override fun onFailure(error: Throwable) {
                Log.e(TAG, "Spotify connection failed", error)
                isConnecting = false
                notifyConnectionChanged(false)
                if (error is SpotifyAppRemoteException) {
                    Log.e(TAG, "${error.errorCode}: ${error.message}")
                }
            }
        })
    }

    fun disconnect() {
        playerStateSubscription?.cancel()
        playerStateSubscription = null

        spotifyAppRemote?.let { SpotifyAppRemote.disconnect(it) }
        spotifyAppRemote = null
        lastPlayerState = null
        notifyConnectionChanged(false)
    }

    fun togglePlayPause() {
        val remote = spotifyAppRemote ?: return
        val isPaused = lastPlayerState?.isPaused ?: true
        if (isPaused) {
            remote.playerApi.resume()
        } else {
            remote.playerApi.pause()
        }
    }

    fun skipNext() {
        spotifyAppRemote?.playerApi?.skipNext()
    }

    fun skipPrevious() {
        spotifyAppRemote?.playerApi?.skipPrevious()
    }

    private fun startPlayerStateSubscription() {
        playerStateSubscription?.cancel()
        playerStateSubscription = spotifyAppRemote?.playerApi?.subscribeToPlayerState()?.apply {
            setEventCallback { state ->
                lastPlayerState = state
                notifyPlayerStateChanged(state)
            }
            setErrorCallback { error ->
                Log.e(TAG, "Player state subscription error", error)
            }
        }
    }

    private fun notifyConnectionChanged(connected: Boolean) {
        mainHandler.post {
            listeners.forEach { listener ->
                listener.onConnectionChanged(connected)
            }
        }
    }

    private fun notifyPlayerStateChanged(state: PlayerState?) {
        mainHandler.post {
            listeners.forEach { listener ->
                listener.onPlayerStateChanged(state)
            }
        }
    }

    private fun buildRedirectUri(): String {
        val scheme = context.getString(R.string.spotify_redirect_scheme)
        val host = context.getString(R.string.spotify_redirect_host)
        return "$scheme://$host"
    }

    companion object {
        private const val TAG = "SpotifyController"
        private const val PLACEHOLDER_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID"
    }
}
