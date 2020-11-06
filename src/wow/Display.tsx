import * as React from 'react';
// import {WebRTCDisplayer, WebRTCDisplayer as Displayer} from './client'
//
// const config =  {
//     WEBRTC_SDP_URL: 'wss://str.darsapp.me/webrtc-session.json',
//     WEBRTC_APPLICATION_NAME: 'livx',
//     WEBRTC_FRAME_RATE: 10,
//     WEBRTC_AUDIO_BIT_RATE: 24,
//     WEBRTC_VIDEO_BIT_RATE: 200,
// }
//
// interface State {
//     muteVideo: boolean
//     muteAudio: boolean
//     started: boolean
//     perm: boolean
// }
//
// export class Display extends React.Component<any, State>{
//     private _localVideoRef= React.createRef<WebRTCDisplayer>()
//
//     constructor(prop: any) {
//         super(prop);
//
//         this.state = {
//             muteVideo: false,
//             muteAudio: false,
//             started: false,
//             perm: false,
//         }
//     }
//
//     private getPerm() {
//         let hold = this.state.perm
//         this._localVideoRef.current && this._localVideoRef.current.getPermissions()
//         this.setState({
//             perm: !hold
//         })
//     }
//
//     private muteVideo() {
//         let hold = this.state.muteVideo
//         this._localVideoRef.current && this._localVideoRef.current.muteVideo(!hold)
//         this.setState({
//             muteVideo: !hold
//         })
//     }
//
//     private muteAudio() {
//         let hold = this.state.muteAudio
//         this._localVideoRef.current && this._localVideoRef.current.muteAudio(!hold)
//         this.setState({
//             muteAudio: !hold
//         })
//     }
//
//     private dissconnect() {
//         if (this.state.perm === true) {
//             let hold = this.state.started
//
//             if (!hold)
//                 this._localVideoRef.current && this._localVideoRef.current.retry()
//             else
//                 this._localVideoRef.current && this._localVideoRef.current.disconnect()
//
//             this.setState({
//                 started: !hold
//             })
//         } else alert("must get permissions")
//     }
//
//     render() {
//         console.log(this.state)
//         return <>
//             <Displayer
//                 ref={this._localVideoRef}
//                 id="publisher-test"
//                 className="d-block"
//                 streamName="mahdaia"
//                 style={{width: '60vh', height: '60vh'}}
//                 config={config}
//                 onVideoStateChanged={(state) => {
//                     this.setState({
//                         started: state.isPublishing
//                     })
//                 }}
//             />
//             {
//                 <p className="text-danger text-center">
//                     <button className="btn btn-danger"
//                             onClick={this.getPerm.bind(this)}
//                     ><i className="fas redo-alt"></i> GETTING PERMISSIONS</button>
//                 </p>
//             }
//             {
//                 <p className="text-danger text-center">
//                     <button className="btn btn-danger"
//                             onClick={this.dissconnect.bind(this)}
//                     ><i className="fas redo-alt"></i> {this.state.started === true && this.state.perm === true ? 'DISCONNECT STREAMING' : 'START STREAMING'}</button>
//                 </p>
//             }
//             {
//                 <p className="text-danger text-center">
//                     <button className="btn btn-danger"
//                             onClick={this.muteVideo.bind(this)}
//                     ><i className="fas redo-alt"></i> {this.state.muteVideo === true ? 'UnMUTE VIDEO' : 'MUTE VIDEO'}</button>
//                 </p>
//             }
//             {
//                 <p className="text-danger text-center">
//                     <button className="btn btn-danger"
//                             onClick={this.muteAudio.bind(this)}
//                     ><i className="fas redo-alt"></i> {this.state.muteAudio === true ? 'UnMUTE AUDIO' : 'MUTE AUDIO'}</button>
//                 </p>
//             }
//         </>
//     }
// }
