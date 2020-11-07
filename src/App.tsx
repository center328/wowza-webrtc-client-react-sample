import React, {Component} from 'react';
import './App.css';
import './styles/style.css';
import {Utils} from './Kurento/Utils';

class App extends Component<any, any> {

    private utils: Utils
    constructor(props: any) {
        super(props);
        this.state = {
            name : "",
            room: "",
            header_text: "",
            viewer: false,
            joinVisibility: true,
            roomVisibility: false
        };
        this.utils = new Utils(this.leaveViewRoom)
    }

    handleChangeName = (e:any) =>{
        this.setState({name: e.target.value});
    }

    handleChangeRoom = (e:any) =>{
        this.setState({room: e.target.value});
    }

    handleChangeViewer = (e:any) =>{
        this.setState({viewer: e.target.value});
    }

    handleChangeViewerRoom = (e:any) =>{
        this.setState({viewer: e.target.value});
        this.utils.switchParticipating(e.target.value);
    }

    render() {
        return (
                <div id="container">
                    <div id="wrapper">
                        <div id="join" className="animate join" style={{display:this.state.joinVisibility ? "block" : "none"}}>
                            <div>
                                <p>
                                    <input type="text" name="name" id="name" value={this.state.name} onChange={this.handleChangeName}
                                           placeholder="Username" required />
                                </p>
                                <p>
                                    <input type="text" name="room" id="roomName" value={this.state.room} onChange={this.handleChangeRoom}
                                           placeholder="Room" required />
                                </p>
                                <p>
                                    <input type="checkbox" id="viewer" name="viewer" value="viewer" onChange={this.handleChangeViewer}/>
                                    <label htmlFor="viewer"> I am a Viewer</label><br/>
                                </p>
                                <p>
                                    <input type="button" name="commit" value="Join!"  onClick={this.register}/>
                                </p>
                            </div>
                        </div>
                        <div id="room" style={{display:this.state.roomVisibility ? "block" : "none"}}>
                            <p>
                                <input type="checkbox" id="viewerRoom" name="viewerRoom" value="viewerRoom" onChange={this.handleChangeViewerRoom} />
                                    <label htmlFor="viewerRoom"> I am a Viewer</label><br/>
                            </p>
                            <h2 id="room-header">{this.state.header_text}</h2>
                            <div id="participants"></div>
                            <input type="button" id="button-leave" onMouseUp={() => this.utils.leaveRoom()}
                                   value="Leave room" />
                        </div>
                    </div>
                </div>
        );
    }

    register = () => {
        this.setState({
            header_text:'ROOM ' + this.state.room + ' NAME: ' + this.state.name,
            joinVisibility: false,
            roomVisibility: true
        });

        this.utils.register(
            this.state.name,
            this.state.room,
            this.state.viewer
        )
    }

    leaveViewRoom = () => {
        this.setState({
            header_text: "",
            joinVisibility: true,
            roomVisibility: false
        });
    }
}

export default App;
