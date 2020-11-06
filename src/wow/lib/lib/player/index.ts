import { WebRTCConfiguration } from '../interface'
import WebRtcPeer from 'kurento-utils'
import { cnsl } from '../utils'

window.cnsl_debug = true

export interface WebRTCPlayerStatus {
  isMuted?: boolean
  isPlaying: boolean
}

export class WebRTCPlayer {

  public webRtcPeer?: any = undefined    // if set, we are publishing.
  public ws?: WebSocket = undefined

  public get isMuted(): boolean|undefined {
    if (!this.video) {
      return undefined
    }
    return this.video.muted
  }

  public set isMuted(value: boolean|undefined) {
    if (!this.video) {
      throw new Error('Unable to configure isMuted.')
    }
    if (value === undefined) {
      throw new Error('Unable to configure undefined as muted.')
    }
    this.video.muted = value
    this._reportStatus()
  }

  public get isPlaying(): boolean {
    return !!this.webRtcPeer
  }

  constructor(private config: WebRTCConfiguration, public video: HTMLVideoElement, public onStateChanged: (status: WebRTCPlayerStatus) => void) {
    // Normalize window/navigator APIs
    RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
    RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
    RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription
    URL = window.URL || window.webkitURL

    // // As for mobile .. allow autoPlay, always muted the audio by default.
    // if (isMobileBrowser()) {
    //   this.video.muted = true
    // }
    this.video.onplay = () => {
      this._reportStatus()
    }

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

  onOfferViewer = (error:string, offerSdp:string) => {
    if (error) return new Error(error)

    let message = {
      id : 'viewer',
      sdpOffer : offerSdp
    }
    this.sendMessage(message);
  }

  /**
   * Connect to WebRTC source, acquire media, and attach to target videoElement.
   *
   * @param streamName
   */
  async connect(streamName: string) {

    if (!this.webRtcPeer) {
      let options = {
        localVideo: this.video,
        onicecandidate : this.onIceCandidate
      }

      this.webRtcPeer = WebRtcPeer.WebRtcPeer.WebRtcPeerRecvonly(options, (error) => {
        if(error) return new Error(error);

        this.webRtcPeer.generateOffer(this.onOfferViewer);
      });
    }
  }

  disconnect = () => {
    if (this.webRtcPeer) {
      this.webRtcPeer.dispose()
      cnsl.log('[Player] Remove peerConnection ... calling close()', this.webRtcPeer)
    } else {
      cnsl.log('[Player] Remove peerConnection ... peerConnection already removed.', this.webRtcPeer)
    }
    if (this.ws) {
      this.ws.close()
      cnsl.log('[Player] Remove wsConnection ... calling close()', this.ws)
    } else {
      cnsl.log('[Player] Remove wsConnection ... wsConnection already removed.')
    }

    this.webRtcPeer = undefined
    this.ws = undefined

    this._reportStatus()

    cnsl.log("[Player] Disconnected")
  }

  _reportStatus = () => {
    this.onStateChanged({
      isMuted: this.isMuted,
      isPlaying: this.isPlaying,
    })
  }
}
