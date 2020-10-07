# WoWZA WebRTC Client React Sample Components

## Author 
    Arezoumandi.m@gmail.com "Mahdi Arezoumandi"
## Usage

**Prepare Configuration**

```ts
import { WebRTCConfiguration } from './lib'

const config: WebRTCConfiguration =  {
  WEBRTC_SDP_URL: 'wss://my-domain.streamlock.net/webrtc-session.json',
  WEBRTC_APPLICATION_NAME: 'myWebRTCApp',
  WEBRTC_FRAME_RATE: 29,
  WEBRTC_AUDIO_BIT_RATE: 64,
  WEBRTC_VIDEO_BIT_RATE: 360,
}
```

**For Publishing**

```jsx

<Publisher id="publisher-test"
  ref="publisher"
  className="d-block"
  streamName="my-stream-name"
  style={{ width: '100%', height: '100%'}}
  config={ config }
  onVideoStateChanged={(state) => {
    console.log('Publisher state has changed', state)
  }}
/>
```

**For Playing**

```jsx
<Player
  id="player-test"
  ref="player"
  streamName="my-stream-name"
  style={{ width: '100%', height: '100vh'}}
  rotate="cw"   // 'cw'|'none'|'ccw'
  config={ config }
  autoPlay={false}
  onPlayerStateChanged={(status) => {
    console.log('Player state has changed', status)
  }}/>
```
