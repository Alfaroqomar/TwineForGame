import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {App} from './app';
import './util/i18n';

import { persistence } from './collaboration/ydoc'

// Wait for IndexedDB to restore before pushing local state


ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
);
