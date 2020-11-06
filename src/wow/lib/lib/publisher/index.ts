import { WebRTCConfiguration } from '../interface'
import WebRtcPeer from 'kurento-utils'
import { forEach } from 'lodash'
import {supportGetUserMedia, queryForCamera, cnsl, supportGetDisplayMedia} from '../utils'

window.cnsl_debug = true

export class WebRTCPublisher {

  private userAgent = navigator.userAgent
  private constraints: MediaStreamConstraints = {
    video: true,                // default = no-facing-mode
    audio: true
  }
  public webRtcPeer?: any = undefined    // if set, we are publishing.
  public ws?: WebSocket = undefined

  private _lastError?: Error = undefined

  /**
   * Holding = disable microphone only.
   */
  public get isHolding(): boolean {
    if (!this.webRtcPeer) {
      return false
    }
    const audioTracks = this.webRtcPeer.getLocalStream()
    if (audioTracks.length > 0) {
      return !audioTracks[0].enabled
    }
    return false
  }

  public set isHolding(value: boolean) {
    if (!this.webRtcPeer) {
      return
    }
    forEach(this.webRtcPeer.getLocalStream().getAudioTracks(), (track) => { track.enabled = !value })
    this.statusListener && this.statusListener()
  }

  public get isPublishing(): boolean {
    return !!this.webRtcPeer
  }

  public get isPreviewEnabled(): boolean {
    return !!this.video && (!!this.video.src || !!this.video.srcObject)
  }

  public get streamSourceConstraints(): MediaStreamConstraints {
    return this.constraints
  }

  public get lastError(): Error|undefined {
    return this._lastError
  }

  constructor(
      private config: WebRTCConfiguration,
      public video: HTMLVideoElement | undefined,
      mediaStreamConstraints: MediaStreamConstraints,
      private source: string,
      private statusListener?: () => void
  ) {
    // Validate if browser support getUserMedia or not?

    if (!this.source)
      this.source = 'camera'

    if (this.source === 'camera') {
      if (!supportGetUserMedia()) {
        throw new Error('Your browser does not support getUserMedia API')
      }
    } else {
      if (!supportGetDisplayMedia()) {
        throw new Error('Your browser does not support getDisplayMedia API')
      }
    }

    // Normalize window/navigator APIs
    if (this.source === 'camera')
      navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia
    RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
    RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
    RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription
    URL = window.URL || window.webkitURL

    // Update constraints.
    this.constraints = mediaStreamConstraints

    cnsl.log('WebRTC Handler started (agent=', this.userAgent, this.constraints, ')')

    queryForCamera(this.streamSourceConstraints, this.source)
      .catch(error => {
        cnsl.error('[Publisher] Unable to locate Camera', error)
      })

    this.ws = new WebSocket('wss://185.174.248.119:8888/kurento');
    // this.ws = new WebSocket('wss://localhost:8443/one2many1');

    let _this = this;
    this.ws.onmessage = function(message) {
      let parsedMessage = JSON.parse(message.data);
      console.info('Received message: ' + message.data);

      switch (parsedMessage.id) {
        case 'presenterResponse':
          _this.presenterResponse(parsedMessage);
          break;
        case 'viewerResponse':
          _this.viewerResponse(parsedMessage);
          break;
        case 'stopCommunication':
          _this.disconnect();
          break;
        case 'iceCandidate':
          _this.webRtcPeer.addIceCandidate(parsedMessage.candidate)
          break;
        default:
          console.error('Unrecognized message', parsedMessage);
      }
    }

  }

  /**
   * Begin connect to server, and publish the media.
   *
   * @throws Error upon failure to create connection.
   */
  public async connect(streamName: string) {
    try {
      cnsl.log('Trying to connect with ', streamName)
      this._lastError = undefined
      this.statusListener && this.statusListener()
      await this._connect(streamName)
      cnsl.log('Publishing stream', streamName)
    } catch (error) {
      // handle error
      this._reportError(error)
      throw error
    }
  }

  onIceCandidate = (candidate: any) => {
    console.log('Local candidate' + JSON.stringify(candidate));

    let message = {
      id : 'onIceCandidate',
      candidate : candidate
    }
    this.sendMessage(message);
  }

  sendMessage = (message: any) => {
    let jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    if (this.ws)
      this.ws.send(jsonMessage);
  }

  onOfferPresenter = (error:string, offerSdp:string) => {
    if (error) return new Error(error);

    let message = {
      id : 'presenter',
      sdpOffer : offerSdp
    };
    this.sendMessage(message);
  }

  presenterResponse = (message: any) => {
    if (message.response != 'accepted') {
      let errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
      this.disconnect();
    } else {
      this.webRtcPeer.processAnswer(message.sdpAnswer);
    }
  }

  viewerResponse = (message: any) => {
    if (message.response != 'accepted') {
      let errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
      this.disconnect();
    } else {
      this.webRtcPeer.processAnswer(message.sdpAnswer);
    }
  }

  private async _connect(streamName: string): Promise<void> {

    if (!this.webRtcPeer) {
      let options = {
        localVideo: this.video,
        onicecandidate : this.onIceCandidate,
        mediaConstraints: this.constraints
      }

      this.webRtcPeer = WebRtcPeer.WebRtcPeer.WebRtcPeerSendonly(options, (error) => {
        if(error) return new Error(error);

        this.webRtcPeer.generateOffer(this.onOfferPresenter);
      });
    }
  }

  _reportError = (error: Error) => {
    this._lastError = error
    this.disconnect()
  }

  disconnect = () => {

    if (this.webRtcPeer) {
      let message = {
        id : 'stop'
      }
      this.sendMessage(message);

      if (this.webRtcPeer) {
        this.webRtcPeer.dispose()
        cnsl.log('[Publisher] Remove peerConnection ... calling close()', this.webRtcPeer)
      } else {
        cnsl.log('[Publisher] Remove peerConnection ... peerConnection already removed.', this.webRtcPeer)
      }
      if (this.ws) {
        this.ws.close()
        cnsl.log('[Publisher] Remove wsConnection ... calling close()', this.ws)
      } else {
        cnsl.log('[Publisher] Remove wsConnection ... wsConnection already removed.')
      }

      this.webRtcPeer = undefined
      this.ws = undefined

      this.statusListener && this.statusListener()

      cnsl.log("[Publisher] Disconnected")
    }
  }
}
