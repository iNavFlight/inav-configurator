import './../src/css/styles.css'

import fs from 'fs';

fs.open('c:\\mylog.log', 'r+', (err) => {
    console.log(err);
});