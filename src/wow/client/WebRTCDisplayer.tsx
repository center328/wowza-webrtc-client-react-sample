import * as React from 'react'
import { WebRTCConfiguration, WebRTCPublisher as PublisherHandler } from '../lib/lib'
import {IPublisher, WebRTCVideoStateChanged, CameraSource} from './IPublisher'

const cameraSourceToConstraints = (): MediaStreamConstraints => {
  return {
    audio: false,
    video: {
      width: {min: 160, ideal: 320, max: 480},
    }
  }
}

const constraintsToCameraSource = (from: MediaStreamConstraints): CameraSource => {
  if (from.video === true) {
    return 'any'
  }
  const json = JSON.stringify(from.video)
  return /environment/.test(json) ? 'environment' : 'user'
}

interface Props {
  id: string,                       // Html DOM's id
  style?: React.CSSProperties,      // Html CSS Properties
  trace?: boolean                   // Enable Logs in Console?
  className?: string
  autoPreview: boolean              // start preview when tryToConnect(), stop preview on disconnect()
  config: WebRTCConfiguration
  usingCamera: CameraSource
  showErrorOverlay: boolean
  enhanceMode: 'auto'|boolean
  videoCodec: 'H264'|'VPX'
  streamName: string
  onVideoStateChanged?: WebRTCVideoStateChanged
}

interface State {
  streamName?: string               // Publishing stream name
  isCameraReady: boolean
  isPreviewing: boolean
  publisherError: Error|undefined
  muteVideo: boolean
  muteAudio: boolean
}

export class WebRTCDisplayer extends React.Component<Props, State> implements IPublisher {

  public static defaultProps: Partial<Props> = {
    trace: true,
    autoPreview: true,
    showErrorOverlay: true,
    usingCamera: 'any',
    videoCodec: 'H264',
    enhanceMode: 'auto'
  }

  private _localVideoRef = React.createRef<HTMLVideoElement>()

  private handler!: PublisherHandler

  public get isPreviewEnabled(): boolean {
    return this.state.isPreviewing
  }

  private get videoElement(): HTMLVideoElement|undefined {
    return this._localVideoRef.current || undefined
  }

  componentWillUnmount() {
    this.disconnect()
  }

  componentDidUpdate(prevProps: Props) {
    // Keep enhance mode up-to-date.
    if (this.props.enhanceMode !== prevProps.enhanceMode) {
      this.handler.enhanceMode = this.props.enhanceMode
    }
  }

  constructor(props: Props) {
    // Properties
    // - Assign default values to props.
    super(props)

    // States declaration
    // - No states is required at this point.
    this.state = {
      isCameraReady: true,
      isPreviewing: true,
      publisherError: undefined,
      streamName: undefined,
      muteVideo: false,
      muteAudio: false
    }

    // so `statusInvalidated` can be called without bindings.
    this.statusInvalidated = this.statusInvalidated.bind(this)
  }

  render() {
    return <div
        className={`webrtc-publisher ${this.props.className} ${this.state.isPreviewing ? 'previewing': '' } ${this.state.isCameraReady ? '' : 'disabled'}`}
        style={{backgroundColor: this.state.publisherError ? 'red' : 'none'}}
    >
      <video
          id={this.props.id}
          ref={this._localVideoRef}
          playsInline={true}
          muted={true}
          controls={false}
          autoPlay={true}
          style={{height: '100%', width: '100%', ...this.props.style}} />
      {
        this.state.publisherError &&
        <div className="unmute-blocker d-flex justify-content-center align-items-center"
             onClick={this.retry.bind(this)}>
          {
            this.state.streamName && this.props.showErrorOverlay &&
            <p className="text-danger text-center">
              {`${this.state.publisherError.message}`}<br/><br/>
              <button className="btn btn-danger"><i className="fas redo-alt"></i> TAP TO RECONNECT</button>
            </p>
          }
        </div>
      }
    </div>
  }

  public getPermissions() {
    // Create WebProducer object.
    this.handler = new PublisherHandler(
        this.props.config,
        cameraSourceToConstraints(),
        this.props.enhanceMode,
        this.props.videoCodec,
        'screen',
        this.statusInvalidated
    )

    // localVideo is now ready (as it is mounted)
    this.startPreview()
  }

  /**
   * connect method invoke from within Publisher component built-in UI.
   */
  public retry() {
    const streamName = this.props.streamName
    if (!streamName) {
      return
    }
    this.publish(streamName).catch(error => {
      console.error('Failed to re-connect stream', error)
    })
  }

  public async stopPreview() {
    await this.handler.detachUserMedia()
  }

  public async startPreview() {
    if (this.videoElement) {
      await this.handler.attachUserMedia(this.videoElement)
    }
  }

  public async publish(streamName: string): Promise<void> {
    await this.handler.connect(streamName)

  }

  public async disconnect() {
    await this.handler.disconnect()
    // if (this.isPreviewEnabled && this.props.autoPreview) {
    //   await this.handler.detachUserMedia()
    // }
  }

  public async switchStream() {
    await this.handler.switchStream(cameraSourceToConstraints(), true)
    this.statusInvalidated()
  }

  public hold(hold: boolean) {
    this.handler.isHolding = hold
  }

  public async muteVideo(hold: boolean) {
    if (this.state.muteVideo !== hold) {
      this.setState({muteVideo: hold})
      if (hold)
        await this.handler.switchStream({
          audio: !this.state.muteAudio,
          video: false
        }, true)
      else
        await this.handler.switchStream({
          audio: !this.state.muteAudio,
          video: {
            width: {min: 160, ideal: 320, max: 480},
          }
        }, true)
      this.statusInvalidated()
    }
  }

  public async muteAudio(hold: boolean) {
    if (this.state.muteAudio !== hold) {
      this.setState({muteAudio: hold})
      if (this.state.muteVideo)
        await this.handler.switchStream({
          audio: !hold,
          video: false
        }, true)
      else
        await this.handler.switchStream({
          audio: !hold,
          video: {
            width: {min: 160, ideal: 320, max: 480},
          }
        }, true)
      this.statusInvalidated()
    }
  }

  private statusInvalidated() {
    console.log({
      isCameraReady: !this.handler.isCameraMuted,
      isHolding: this.handler.isHolding,
      isPublishing: this.handler.isPublishing,
      isPreviewEnabled: this.isPreviewEnabled,
      publisherError: this.handler.lastError
    })
    // Update local states
    this.setState({
      isCameraReady: !this.handler.isCameraMuted,
      isPreviewing: this.handler.isPreviewEnabled,
      publisherError: this.handler.lastError
    })
    // dispatch update to exterior state handler
    this.props.onVideoStateChanged && this.props.onVideoStateChanged({
      isCameraReady: !this.handler.isCameraMuted,
      isHolding: this.handler.isHolding,
      isPublishing: this.handler.isPublishing,
      isPreviewEnabled: this.isPreviewEnabled,
      publisherError: this.handler.lastError,
      usingCamera: constraintsToCameraSource(this.handler.streamSourceConstraints)
    })
  }

}
