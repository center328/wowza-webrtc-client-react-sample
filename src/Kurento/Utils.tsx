/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import {Participant} from './Participant';
import WebRtcPeer from 'kurento-utils';

export class Utils {

    private ws: WebSocket;
    private participants: any = {};
    private name: string = '';
    private viewerChecked: boolean = false;
    private room: string = '';

    constructor(private leaveViewRoom:any) {
        this.ws = new WebSocket('wss://127.0.0.1:8080/groupcall');


        this.ws.onmessage = (message) => {
            let parsedMessage = JSON.parse(message.data);
            console.info('Received message: ' + message.data);

            switch (parsedMessage.id) {
                case 'existingParticipants':
                    this.onExistingParticipants(parsedMessage);
                    break;
                case 'newParticipantArrived':
                    this.onNewParticipant(parsedMessage);
                    break;
                case 'participantLeft':
                    this.onParticipantLeft(parsedMessage);
                    break;
                case 'receiveVideoAnswer':
                    this.receiveVideoResponse(parsedMessage);
                    break;
                case 'iceCandidate':
                    this.participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate, (error:any) => {
                        if (error) {
                            console.error("Error adding candidate: " + error);
                            return;
                        }
                    });
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        }

    }

    register = (name: string, room: string, viewerChecked: boolean) => {
        this.name = name;
        this.room = room;
        this.viewerChecked = viewerChecked;
        let message = {
            id : 'joinRoom',
            name : name,
            room : room,
            viewer : viewerChecked,
        }
        this.sendMessage(message);
    }

    onNewParticipant = (request:any) => {
        this.receiveVideo(request.name);
    }

    receiveVideoResponse = (result: any) => {
        this.participants[result.name].rtcPeer.processAnswer (result.sdpAnswer, (error: any) => {
            if (error) return console.error (error);
        });
    }

    // callResponse(message: any) {
    //     if (message.response != 'accepted') {
    //         console.info('Call not accepted by peer. Closing call');
    //         stop();
    //     } else {
    //         webRtcPeer.processAnswer(message.sdpAnswer, function (error:any) {
    //             if (error) return console.error (error);
    //         });
    //     }
    // }

    onExistingParticipants = (msg: any) => {
        if (!this.viewerChecked) {
            let constraints = {
                audio: true,
                video: {
                    mandatory: {
                        maxWidth: 320,
                        maxFrameRate: 15,
                        minFrameRate: 15
                    }
                }
            };
            console.log(this.name + " registered in room " + this.room);
            let participant = new Participant(this.name, this.sendMessage);
            this.participants[this.name] = participant;
            let video = participant.getVideoElement();

            let options = {
                localVideo: video,
                mediaConstraints: constraints,
                onicecandidate: participant.onIceCandidate.bind(participant)
            }
            participant.rtcPeer = WebRtcPeer.WebRtcPeer.WebRtcPeerSendonly(options,
                (error: any) => {
                    if (error) {
                        return console.error(error);
                    }
                    participant.rtcPeer.generateOffer(participant.offerToReceiveVideo.bind(participant));
                });

        }
        msg.data.forEach(this.receiveVideo);
    }

    leaveRoom = () => {
        this.sendMessage({
            id : 'leaveRoom'
        });

        for ( var key in this.participants) {
            this.participants[key].dispose();
        }

        this.leaveViewRoom();

        this.ws.close();
    }

    switchParticipating = (viewerChecked: boolean) => {
        this.viewerChecked = viewerChecked
        this.sendMessage({
            id : 'leaveRoom'
        });

        setTimeout(()=>{
            for ( let key in this.participants) {
                this.participants[key].dispose();
            }

            let message = {
                id : 'joinRoom',
                name : this.name,
                room : this.room,
                viewer : this.viewerChecked,
            }
            this.sendMessage(message);
        }, 1000);

    }

    receiveVideo = (sender: any) => {
        let participant = new Participant(sender, this.sendMessage);
        this.participants[sender] = participant;
        let video = participant.getVideoElement();

        let options = {
            remoteVideo: video,
            onicecandidate: participant.onIceCandidate.bind(participant)
        }

        participant.rtcPeer = WebRtcPeer.WebRtcPeer.WebRtcPeerRecvonly(options,
             (error: any) => {
                if(error) {
                    return console.error(error);
                }
                 participant.rtcPeer.generateOffer (participant.offerToReceiveVideo.bind(participant));
            });;
    }

    onParticipantLeft = (request: any) => {
        console.log('Participant ' + request.name + ' left');
        let participant = this.participants[request.name];
        participant.dispose();
        delete this.participants[request.name];
    }

    sendMessage = (message: any) => {
        let jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + jsonMessage);
        this.ws.send(jsonMessage);
    }

    dispose = () => {
        this.ws.close();
    }
}
