import polyfill from './polyfill'

import Alien from './alien';

import FlowchartAdapter from './flowchartadapter'

// install all `A-L-I-E-N` event first
Alien.install();

window.FlowChart = FlowchartAdapter;
