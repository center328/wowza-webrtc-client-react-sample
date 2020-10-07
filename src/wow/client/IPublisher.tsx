export type CameraSource = 'user'|'environment'|'any'|'screen'

export interface IPublisherStatus {
  isHolding: boolean
  isCameraReady: boolean
  isPublishing: boolean
  isPreviewEnabled: boolean
  publisherError: Error|undefined
}

export interface WebRTCPublisherStatus extends IPublisherStatus {
  usingCamera: CameraSource
}

export type IVideoStateChanged = (status: IPublisherStatus) => void

export type WebRTCVideoStateChanged = (status: WebRTCPublisherStatus) => void

export interface IPublisher {

  hold(value: boolean): void

  muteVideo(value: boolean): void

  muteAudio(value: boolean): void

  publish(streamName: string): Promise<void>

  disconnect(): void
}
