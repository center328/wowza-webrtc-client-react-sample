import React from 'react';
import { WebRTCConfiguration } from 'wowza-webrtc-client'
import { WebRTCPublisher as Publisher } from './client'

const config: WebRTCConfiguration =  {
  WEBRTC_SDP_URL: 'wss://str.darsapp.me/webrtc-session.json',
  WEBRTC_APPLICATION_NAME: 'livx',
  WEBRTC_FRAME_RATE: 10,
  WEBRTC_AUDIO_BIT_RATE: 24,
  WEBRTC_VIDEO_BIT_RATE: 200,
}

function Publish() {
  return (
      <Publisher id="publisher-test"
                 className="d-block"
                 streamName="mahdaia"
                 style={{ width: '60vh', height: '60vh'}}
                 config={ config }
                 onVideoStateChanged={(state) => {
                   console.log('Publisher state has changed', state)
                 }}
      />

  );
}

export default Publish;
