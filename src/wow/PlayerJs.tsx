import * as React from 'react';
import {Component} from 'react';

import ReactPlayer from 'react-player'

export class ResponsivePlayer extends Component {
    render () {
        return (
            // <div className='player-wrapper'>
                <ReactPlayer
                    className='react-player'
                    url='http://212.33.199.91:1935/livx/test/playlist.m3u8'
                    width='500px'
                    height='500px'
                    controls
                />
            // </div>
        )
    }
}
