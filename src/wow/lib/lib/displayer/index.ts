import { WebRTCConfiguration } from '../interface'
import { forEach } from 'lodash'
import {createWebSocket, cnsl, supportGetDisplayMedia} from '../utils'
import { Logger } from '../logger';

export class WebRTCDisplayer {
//
//   button.onclick = function() {
//     this.disabled = true;
//
//
//   if(!navigator.getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
//   var error = 'Your browser does NOT supports getDisplayMedia API.';
//   document.querySelector('h1').innerHTML = error;
//   document.querySelector('h1').style.color = 'red';
//
//   document.querySelector('video').style.display = 'none';
//   button.style.display = 'none';
//   throw new Error(error);
// }
//
// function addStreamStopListener(stream, callback) {
//   stream.addEventListener('ended', function() {
//     callback();
//     callback = function() {};
//   }, false);
//   stream.addEventListener('inactive', function() {
//     callback();
//     callback = function() {};
//   }, false);
//   stream.getTracks().forEach(function(track) {
//     track.addEventListener('ended', function() {
//       callback();
//       callback = function() {};
//     }, false);
//     track.addEventListener('inactive', function() {
//       callback();
//       callback = function() {};
//     }, false);
//   });
// }









  private userAgent = navigator.userAgent
  private localStream?: MediaStream                         // if set, preview stream is available.
  private currentContraints: MediaStreamConstraints = {
    video: true,                // default = no-facing-mode
    audio: true
  }
  private peerConnection?: RTCPeerConnection = undefined    // if set, we are publishing.
  private wsConnection?: WebSocket = undefined
  private userData = {param1:"value1"}
  private videoElement?: HTMLVideoElement = undefined

  private _lastError?: Error = undefined

  /**
   * Holding = disable microphone only.
   */
  public get isHolding(): boolean {
    if (!this.localStream) {
      return false
    }
    const audioTracks = this.localStream.getAudioTracks()
    if (audioTracks.length > 0) {
      return !audioTracks[0].enabled
    }
    return false
  }

  public set isHolding(value: boolean) {
    if (!this.localStream) {
      return
    }
    forEach(this.localStream.getAudioTracks(), (track) => { track.enabled = !value })
    this.statusListener && this.statusListener()
  }

  public get isPublishing(): boolean {
    return !!this.peerConnection
  }

  public get isPreviewEnabled(): boolean {
    return !!this.videoElement && (!!this.videoElement.src || !!this.videoElement.srcObject)
  }

  public get streamSourceConstraints(): MediaStreamConstraints {
    return this.currentContraints
  }

  public get lastError(): Error|undefined {
    return this._lastError
  }

  public get rtcPeerConnectionState(): RTCPeerConnectionState|undefined {
    return this.peerConnection && this.peerConnection.connectionState
  }

  public get rtcSignalingState(): RTCSignalingState|undefined {
    return this.peerConnection && this.peerConnection.signalingState
  }

  public get rtcIceConnectionState(): RTCIceConnectionState|undefined {
    return this.peerConnection && this.peerConnection.iceConnectionState
  }

  constructor(private config: WebRTCConfiguration, videoElement: HTMLVideoElement, mediaStreamConstraints: MediaStreamConstraints, private statusListener?: () => void) {
    // Validate if browser support getDisplayMedia or not?
    if (!supportGetDisplayMedia()) {
      throw new Error('Your browser does not support getDisplayMedia API')
    }
    this.videoElement = videoElement;
    // Normalize window/navigator APIs
    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription
    window.URL = window.URL || window.webkitURL

    // Update constraints.
    this.currentContraints = mediaStreamConstraints

    cnsl.log('WebRTC Handler started (agent=', this.userAgent, this.currentContraints, ')')


    this.invokeGetDisplayMedia((screen: any) => {
      this.addStreamStopListener(screen, function() {
        // location.reload();
      });

      if (this.videoElement)
        this.videoElement.srcObject = screen;

    }, (e: any) => {

      var error = {
        name: e.name || 'UnKnown',
        message: e.message || 'UnKnown',
        stack: e.stack || 'UnKnown'
      };

      if(error.name === 'PermissionDeniedError') {
        // if(location.protocol !== 'https:') {
        //   error.message = 'Please use HTTPs.';
        //   error.stack   = 'HTTPs is required.';
        // }
      }

      console.error(error.name);
      console.error(error.message);
      console.error(error.stack);

      alert('Unable to capture your screen.\n\n' + error.name + '\n\n' + error.message + '\n\n' + error.stack);
    });
  }

  /**
   * Attach user media to configured VideoElement
   */
  public attachUserMedia(videoElement: HTMLVideoElement) {
    // save videoElement
    this.videoElement = videoElement

    // Claim the stream
    // this._claimMedia(this.streamSourceConstraints)
  }
  //
  // private _claimMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  //   // Try getting user media.
  //   const stream = getDisplayMedia(constraints, this.source)
  //
  //   // Camera is not muted. (Camera is available.)
  //   this.isCameraMuted = false
  //
  //   // If videoElement exists - attach it.
  //   if (this.videoElement) {
  //     try {
  //       this.videoElement.srcObject = stream
  //     } catch(elementError) {
  //       cnsl.error('[displayer] attaching video.srcObject failed, Fallback to src ...', this.videoElement, stream)
  //       this.videoElement.src = window.URL.createObjectURL(stream)
  //     }
  //   }
  //
  //   // If peerConnection exists - replace it.
  //   const peerConnection = this.peerConnection
  //   if (peerConnection) {
  //     // Replace track
  //     stream.getTracks().forEach((track) => {
  //       const sender = peerConnection.getSenders().find((sender) => {
  //         return sender.track && sender.track.kind == track.kind || false
  //       })
  //       sender && sender.replaceTrack(track)
  //     })
  //   }
  //
  //   // Select the stream to Local Stream.
  //   this.localStream = stream
  //
  //   // status updated.
  //   this.statusListener && this.statusListener()
  //
  //   return stream
  // }
  //
  // public detachUserMedia() {
  //   if (this.localStream) {
  //     if (this.videoElement && this.videoElement.src) {
  //       this.videoElement.src = ''
  //     }
  //     if (this.videoElement && this.videoElement.srcObject) {
  //       this.videoElement.srcObject = null
  //     }
  //     this._stopStream()
  //     this.statusListener && this.statusListener()
  //   }
  // }
  //
  // /**
  //  * Begin connect to server, and publish the media.
  //  *
  //  * @throws Error upon failure to create connection.
  //  */
  // public connect(streamName: string) {
  //   try {
  //     cnsl.log('Trying to connect with ', streamName)
  //     this._lastError = undefined
  //     this.statusListener && this.statusListener()
  //     this._connect(streamName)
  //     cnsl.log('Publishing stream', streamName)
  //   } catch (error) {
  //     // handle error
  //     this._reportError(error)
  //     throw error
  //   }
  // }
  //
  // /**
  //  * Try to connect to Wowza Server. Will fullfill when stream has been completely established.
  //  *
  //  * @param streamName
  //  */
  // private _connect(streamName: string): Promise<void> {
  //   if (this.peerConnection) {
  //     throw new Error('There is already an active peerConnection!')
  //   }
  //   // grab configs
  //   const conf: WebRTCConfiguration = this.config
  //   const wsURL = conf.WEBRTC_SDP_URL
  //   const streamInfo = {
  //     applicationName: conf.WEBRTC_APPLICATION_NAME,
  //     streamName,
  //     sessionId: "[empty]"    // random me!
  //   }
  //   const videoBitrate = conf.WEBRTC_VIDEO_BIT_RATE
  //   const audioBitrate = conf.WEBRTC_AUDIO_BIT_RATE
  //   const videoFrameRate = conf.WEBRTC_FRAME_RATE
  //
  //   // wsConnect
  //   let wsConnection = createWebSocket(wsURL)
  //   wsConnection.binaryType = 'arraybuffer'
  //
  //   wsConnection.onclose = () => cnsl.log('[displayer] wsConnection.onclose')
  //
  //   wsConnection.onerror = (evt) => {
  //     cnsl.log("[displayer] wsConnection.onerror: "+JSON.stringify(evt));
  //     this._reportError(new Error(JSON.stringify(evt)))
  //   }
  //
  //   /**
  //    * this when peer connection are well established.
  //    */
  //   const negotiationClosure = (offerMessage: string) => new Promise<void>((resolve, reject) => {
  //     cnsl.log('[displayer] enter nego closure!')
  //     wsConnection.onmessage = (evt: any) => {
  //       // Parse incoming message.
  //       const msgJSON = JSON.parse(evt.data)
  //       const msgStatus = Number(msgJSON['status'])
  //       const msgCommand = msgJSON['command']
  //
  //       cnsl.log('[displayer] Incoming message', msgCommand)
  //
  //       Logger.wrap('[displayer] wsConnection.onMessage', (console) => {
  //
  //         if (!this.peerConnection) {
  //           throw new Error('Invalid state! peerConnection is empty!')
  //         }
  //         const peerConnection = this.peerConnection
  //
  //         if (msgStatus != 200) {
  //           // Error
  //           throw new Error(`Failed to publish, cannot handle invalid status: ${msgStatus}`)
  //         }
  //
  //         const sdpData = msgJSON['sdp']
  //         if (sdpData !== undefined) {
  //           console.log(`_ sdp: ${JSON.stringify(sdpData)}`)
  //           peerConnection.setRemoteDescription(new RTCSessionDescription(sdpData))
  //         }
  //
  //         const iceCandidates = msgJSON['iceCandidates']
  //         if (iceCandidates !== undefined) {
  //           for(const index in iceCandidates) {
  //             console.log('_ iceCandidates: ' + JSON.stringify(iceCandidates[index]));
  //             peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
  //           }
  //         }
  //
  //         // Connected! SDP Connection is no longer required.
  //         if (wsConnection != null) {
  //           wsConnection.close()
  //           this.statusListener && this.statusListener()
  //           resolve()
  //         }
  //       }).catch(reject)
  //     }
  //
  //     wsConnection.send(offerMessage)
  //   })
  //
  //   // save it.
  //   this.wsConnection = wsConnection
  //
  //   cnsl.log('[displayer] wsConnection ready!')
  //   try {
  //     // Create Peer Connection Object
  //     const { pc: _pc, pcConnectedPromise } = this._createPeerConnection()
  //
  //     // Create offer
  //     const description = _pc.createOffer()
  //     cnsl.log('[displayer] offer created!', description)
  //
  //     // SDP Munging - hijack SDP message to produce a selected SDP.
  //     if (this.enhanceMode === 'auto' || this.enhanceMode === true) {
  //       const originalSdp = description.sdp
  //
  //       // enhance sdp message
  //       const enhancer = new SDPMessageProcessor(
  //         this.codecMode === 'VPX' ? 'VPX' : '42e01f',    // VideoMode: 'H264=42e01f' or 'VP9=VPX'
  //         'opus'    // AudioMode: 'OPUS'
  //       )
  //       description.sdp = enhancer.enhance(description.sdp, {
  //         audioBitrate,
  //         videoBitrate,
  //         videoFrameRate
  //       })
  //
  //       if (this.enhanceMode === 'auto' && SDPMessageProcessor.isCorrupted(description.sdp)) {
  //         cnsl.log('[displayer] Bad SDP: ', description.sdp)
  //         cnsl.log('[displayer] ... revert')
  //         description.sdp = originalSdp
  //       } else {
  //         cnsl.log('[displayer] Auto Enhance SDPMessage is valid.')
  //       }
  //       cnsl.log('[displayer] Enhance mode updated!')
  //     }
  //
  //     _pc.setLocalDescription(description)
  //     cnsl.log('[displayer] Assigned local description!')
  //
  //     // send offer back with enhanced SDP
  //     const offerMessage = '{"direction":"publish", "command":"sendOffer", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+', "userData":'+JSON.stringify(this.userData)+'}'
  //
  //     this.peerConnection = _pc
  //     this.statusListener && this.statusListener()
  //
  //     cnsl.log('[displayer] Publishing with streamName=', streamName)
  //
  //     // Waiting for Message result.
  //     negotiationClosure(offerMessage)
  //
  //     // Waiting for Connected state
  //     pcConnectedPromise
  //   } catch(error) {
  //     cnsl.error('[displayer] Publishing stream failed', error)
  //     throw error
  //   }
  // }
  //
  // /**
  //  * Set up peerConnection object with abundant event listeners.
  //  *
  //  * @return RTCPeerConnection
  //  */
  // private _createPeerConnection(): {pc: RTCPeerConnection, pcConnectedPromise: Promise<void>} {
  //   const localStream = this.localStream
  //   if (!localStream) {
  //     throw new Error('Invalid state, cannot open connection without video stream to publish.')
  //   }
  //   const peerConnection = new RTCPeerConnection({ iceServers: [] })
  //   peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
  //     if (event.candidate != null) {
  //       cnsl.log(`[Displayer] [PC] onIceCandidate: ${JSON.stringify({'ice': event.candidate})}`)
  //     }
  //   }
  //
  //   const connectedPromise = new Promise<void>((resolve, reject) => {
  //     peerConnection.onicecandidateerror = (event: RTCPeerConnectionIceErrorEvent) => {
  //       const info = {
  //         errorCode: event.errorCode,
  //         errorText: event.errorText,
  //         hostCandidate: event.hostCandidate,
  //         url: event.url
  //       }
  //       cnsl.error(`[Displayer] [PC] onIceCandidateError: ${JSON.stringify(info)}`)
  //       if (event.errorCode >= 300 && event.errorCode <= 699) {
  //         // STUN errors are in the range 300-699. See RFC 5389, section 15.6
  //         // for a list of codes. TURN adds a few more error codes; see
  //         // RFC 5766, section 15 for details.
  //         cnsl.error('[displayer] [PC] ... STUN errors.')
  //       }
  //       else if (event.errorCode >= 700 && event.errorCode <= 799) {
  //         // Server could not be reached; a specific error number is
  //         // provided but these are not yet specified.
  //         cnsl.error('[displayer] [PC] ... server could not be reached.')
  //       }
  //     }
  //
  //     peerConnection.onsignalingstatechange = (ev: Event) => {
  //       const state: any = peerConnection.signalingState
  //       cnsl.log(`[Displayer] [PC] onSignalingStateChange ⇀ ${state}`)
  //       this.statusListener && this.statusListener()
  //     }
  //
  //     peerConnection.oniceconnectionstatechange = (ev: Event) => {
  //       const state: any = peerConnection.iceConnectionState
  //       cnsl.log(`[Displayer] [PC] onIceConnectionStateChange ⇀ ${state}`)
  //       this.statusListener && this.statusListener()
  //     }
  //
  //     /**
  //      * Aggregated connection state has been updated.
  //      *
  //      * @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState
  //      */
  //     let isResolved = false
  //     peerConnection.onconnectionstatechange = (ev: Event) => {
  //       const state = peerConnection.connectionState
  //       cnsl.log(`[Displayer] [PC] onConnectionStateChange ⇀ ${state}`)
  //       this.statusListener && this.statusListener()
  //       if (isResolved) return
  //       if (state === 'connected') {
  //         isResolved = true
  //         resolve()
  //       } else if (state === 'failed') {
  //         isResolved = true
  //         reject(new Error(`Peer Connection state is invalid: ${state}`))
  //       }
  //     }
  //
  //     // Swizzle between Webkit API versions Support here ...
  //     const pc: any = peerConnection
  //     if (!pc.addStream) {
  //       {
  //         const localTracks = localStream.getTracks();
  //         for(const localTrack in localTracks) {
  //           peerConnection.addTrack(localTracks[localTrack], localStream);
  //         }
  //       }
  //     } else {
  //       pc.addStream(localStream)
  //     }
  //   })
  //
  //   return { pc: peerConnection, pcConnectedPromise: connectedPromise }
  // }
  //
  // private _reportError(error: Error) {
  //   this._lastError = error
  //   this.disconnect()
  // }
  //
  // public disconnect() {
  //   if (this.peerConnection) {
  //     this.peerConnection.close()
  //     cnsl.log('[displayer] Remove peerConnection ... calling close()', this.peerConnection)
  //   } else {
  //     cnsl.log('[displayer] Remove peerConnection ... peerConnection already removed.', this.peerConnection)
  //   }
  //   if (this.wsConnection) {
  //     this.wsConnection.close()
  //     cnsl.log('[displayer] Remove wsConnection ... calling close()', this.wsConnection)
  //   } else {
  //     cnsl.log('[displayer] Remove wsConnection ... wsConnection already removed.')
  //   }
  //
  //   this.peerConnection = undefined
  //   this.wsConnection = undefined
  //
  //   this._stopStream()
  //   this.statusListener && this.statusListener()
  //
  //   cnsl.log("[displayer] Disconnected")
  // }
  //
  // private _stopStream() {
  //   // if there is a localStream object, and they are no longer used.
  //   cnsl.log('[displayer] stopping stream [localStream=', this.localStream, 'isPreviewEnabled=', this.isPreviewEnabled, 'isPublishing=', this.isPublishing, ']')
  //   if (this.localStream && !this.isPreviewEnabled && !this.isPublishing) {
  //     cnsl.log('[displayer] Trying to stop stream')
  //     const ls = this.localStream as any
  //     if (ls.stop) {
  //       ls.stop()
  //       cnsl.log('[displayer] Stopping localStream object.')
  //     } else {
  //       for(const track of this.localStream.getTracks()) {
  //         track.stop()
  //         cnsl.log('[displayer] Stopping localStream\'s track:', track)
  //       }
  //     }
  //     this.localStream = undefined
  //     cnsl.log('[displayer] Unbind local stream')
  //   }
  // }

  private invokeGetDisplayMedia(success: (screen: any) => void, error: (e: any) => void) {
    // @ts-ignore
    if(navigator.mediaDevices.getDisplayMedia) {
      // @ts-ignore
      navigator.mediaDevices.getDisplayMedia(this.currentContraints).then(success).catch(error);
    } else {
      // @ts-ignore
      navigator.getDisplayMedia(this.currentContraints).then(success).catch(error);
    }
  }

  private addStreamStopListener(stream: any, callback: () => void) {
    // stream.addEventListener('ended', function() {
    //
    // }, false);
    // stream.addEventListener('inactive', function() {
    //   callback();
    //   callback = function() {};
    // }, false);
    // stream.getTracks().forEach(function(track: any) {
    //   track.addEventListener('ended', function() {
    //     callback();
    //     callback = function() {};
    //   }, false);
    //   track.addEventListener('inactive', function() {
    //     callback();
    //     callback = function() {};
    //   }, false);
    // });
  }
}
