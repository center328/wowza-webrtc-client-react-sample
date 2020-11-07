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

/**
 * Creates a video element for a new participant
 *
 * @param {String} name - the name of the new participant, to be used as tag
 *                        name of the video element.
 *                        The tag of the new element will be 'video<name>'
 * @return
 */
export class Participant {

    private PARTICIPANT_MAIN_CLASS = 'participant main';
    private PARTICIPANT_CLASS = 'participant';

    private container: HTMLDivElement;
    private video: HTMLVideoElement;
    public rtcPeer: any;

    constructor(private name: string, private sendMessage: any) {
        this.container = document.createElement('div');
        this.container.className = this.isPresentMainParticipant() ? this.PARTICIPANT_CLASS : this.PARTICIPANT_MAIN_CLASS;
        this.container.id = name;
        let span = document.createElement('span');
        this.video = document.createElement('video');

        this.container.appendChild(this.video);
        this.container.appendChild(span);
        this.container.onclick = this.switchContainerClass;
        document.getElementById('participants')?.appendChild(this.container);

        span.appendChild(document.createTextNode(name));

        this.video.id = 'video-' + name;
        this.video.autoplay = true;
        this.video.controls = false;

        Object.defineProperty(this, 'rtcPeer', { writable: true});

    }

    getElement = () => {
        return this.container;
    }

    getVideoElement = () => {
        return this.video;
    }

    switchContainerClass = () => {
        if (this.container.className === this.PARTICIPANT_CLASS) {
            let elements = Array.prototype.slice.call(document.getElementsByClassName(this.PARTICIPANT_MAIN_CLASS));
            elements.forEach((item) => {
                item.className = this.PARTICIPANT_CLASS;
            });

            this.container.className = this.PARTICIPANT_MAIN_CLASS;
        } else {
            this.container.className = this.PARTICIPANT_CLASS;
        }
    }

    isPresentMainParticipant = () => {
        return ((document.getElementsByClassName(this.PARTICIPANT_MAIN_CLASS)).length !== 0);
    }

    offerToReceiveVideo = (error:any, offerSdp:any, wp:any) => {
        if (error) return console.error ("sdp offer error")
        console.log('Invoking SDP offer callback function');
        var msg =  { id : "receiveVideoFrom",
            sender : this.name,
            sdpOffer : offerSdp
        };
        this.sendMessage(msg);
    }


    onIceCandidate = (candidate: any, wp: any) => {
        console.log("Local candidate" + JSON.stringify(candidate));

        var message = {
            id: 'onIceCandidate',
            candidate: candidate,
            name: this.name
        };
        this.sendMessage(message);
    }

    dispose = () => {
        try {
            console.log('Disposing participant ' + this.name);
            this.rtcPeer.dispose();
            this.container?.parentNode?.removeChild(this.container);
        } catch (e) {
            console.log(e)
        }
    }
}
