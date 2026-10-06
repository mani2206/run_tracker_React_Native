import { registerRootComponent } from 'expo';
// MUST be imported at the top level, before the app renders.
// The OS can wake your JS with the screen off and the UI never mounted;
// the task has to be defined by then.
import './src/tasks/locationTask';
import App from './App';

registerRootComponent(App);
