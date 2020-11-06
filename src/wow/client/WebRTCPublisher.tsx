import * as React from 'react'
import { WebRTCConfiguration, WebRTCPublisher as PublisherHandler } from '../lib/lib'
import {IPublisher, WebRTCVideoStateChanged, CameraSource} from './IPublisher'

const cameraSourceToConstraints = (src: CameraSource): MediaStreamConstraints => {
  return {
    audio: true,
    video: {
      facingMode: {
        ideal: src
      },
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
  isPreviewing: boolean
  publisherError: Error|undefined
  muteVideo: boolean
  muteAudio: boolean
}

export class WebRTCPublisher extends React.Component<Props, State> implements IPublisher {

  public static defaultProps: Partial<Props> = {
    trace: true,
    autoPreview: true,
    showErrorOverlay: true,
    usingCamera: 'any',
    videoCodec: 'H264',
    enhanceMode: 'auto'
  }

  private _refVideo = React.createRef<HTMLVideoElement>()

  private handler!: PublisherHandler

  public get isPreviewEnabled(): boolean {
    return this.state.isPreviewing
  }

  private get videoElement(): HTMLVideoElement|undefined {
    return this._refVideo.current || undefined
  }

  componentWillUnmount() {
    this.disconnect()
  }

  componentDidMount() {

    // Create WebProducer object.
    this.handler = new PublisherHandler(
        this.props.config,
        this.videoElement,
        cameraSourceToConstraints(this.props.usingCamera),
        'camera',
        this.statusInvalidated
    )
  }

  constructor(props: Props) {
    // Properties
    // - Assign default values to props.
    super(props)

    // States declaration
    // - No states is required at this point.
    this.state = {
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
        className={`webrtc-publisher ${this.props.className} ${this.state.isPreviewing ? 'previewing': '' }`}
        style={{backgroundColor: this.state.publisherError ? 'red' : 'none'}}
    >
      <video
        id={this.props.id}
        ref={this._refVideo}
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

  public async publish(streamName: string): Promise<void> {
    await this.handler.connect(streamName)
  }

  public async disconnect() {
    await this.handler.disconnect()
    // if (this.isPreviewEnabled && this.props.autoPreview) {
    //   await this.handler.detachUserMedia()
    // }
  }

  public hold(hold: boolean) {
    this.handler.isHolding = hold
  }

  private statusInvalidated() {
    console.log({
      isHolding: this.handler.isHolding,
      isPublishing: this.handler.isPublishing,
      isPreviewEnabled: this.isPreviewEnabled,
      publisherError: this.handler.lastError
    })
    // Update local states
    this.setState({
      isPreviewing: this.handler.isPreviewEnabled,
      publisherError: this.handler.lastError
    })
    // dispatch update to exterior state handler
    this.props.onVideoStateChanged && this.props.onVideoStateChanged({
      isHolding: this.handler.isHolding,
      isPublishing: this.handler.isPublishing,
      isPreviewEnabled: this.isPreviewEnabled,
      publisherError: this.handler.lastError,
      usingCamera: constraintsToCameraSource(this.handler.streamSourceConstraints)
    })
  }

}
