import React from 'react';
import { WebRTCPlayer as Player } from './client'

const config =  {
  WEBRTC_SDP_URL: 'wss://str.darsapp.me/webrtc-session.json',
  WEBRTC_APPLICATION_NAME: 'livx'
}

function Play() {
  return (
      <Player
          id="player-test"
          // ref="player"
          streamName="one2many1"
          style={{ width: '100%', height: '70vh'}}
          rotate="none"   // 'cw'|'none'|'ccw'
          config={ config }
          autoPlay={true}
          onPlayerStateChanged={(status) => {
              console.log('Player state has changed', status)
          }}/>

        );
}

export default Play;
