'use strict';

var nwdialog = {

    _context: (typeof global === 'undefined' || typeof global.DOMDocument === 'undefined') ? document : global.DOMDocument,

    setContext: function(context) {
        this._context = context;
    },

    openFileDialog: function(filter, multiple, workdir, callback) {

        var fn          = callback;
        var node        = this._context.createElement('input');
        node.type       = 'file';
        node.id         = 'open-file-dialog';
        node.style      = 'display: none';

        if (typeof filter === 'function') {
            fn = filter;
        } else if (typeof filter === 'string') {
            node.setAttribute('accept', filter);
        } else if (typeof filter === 'boolean' && filter === true) {
            node.setAttribute('multiple', '');
        } else if (this.isArray(filter)) {
            node.setAttribute('accept', filter.join(','));
        }

        if (typeof multiple === 'function') {
            fn = multiple;
        } else if (typeof multiple === 'string') {
            node.setAttribute('nwworkingdir', multiple);
        } else if (typeof multiple === 'boolean' && multiple === true) {
            node.setAttribute('multiple', '');
        }

        if (typeof workdir === 'function') {
            fn = workdir;
        } else if (typeof workdir === 'string') {
            node.setAttribute('nwworkingdir', workdir);
        }

        this._context.body.appendChild(node);
        node.addEventListener('change', function(e) {
            fn(node.value);
            node.remove();
        });
        node.click();

    },

    saveFileDialog: function(name, accept, directory, callback) {
        
        var fn          = callback;
        var node        = this._context.createElement('input');
        node.type       = 'file';
        node.id         = 'save-file-dialog';
        node.style      = 'display: none';
        node.setAttribute('nwsaveas', '');

        if (typeof name === 'function') {
            fn = name;
        } else if (typeof name === 'string') {
            node.setAttribute('nwsaveas', name);
        }

        if (typeof accept === 'function') {
            fn = accept;
        } else if (typeof accept === 'string') {
            node.setAttribute('accept', accept);
        } else if (this.isArray(accept)) {
            node.setAttribute('accept', accept.join(','));
        }

        if (typeof directory === 'function') {
            fn = directory;
        } else if (typeof directory === 'string') {
            node.setAttribute('nwworkingdir', directory);
        }

        this._context.body.appendChild(node);
        node.addEventListener('change', function() {
            fn(node.value);
            node.remove();
        });
        node.click();

    },

    folderBrowserDialog: function(workdir, callback) {
        var fn          = callback;
        var node        = this._context.createElement('input');
        node.type       = 'file';
        node.id         = 'folder-browser-dialog';
        node.style      = 'display: none';
        node.nwdirectory= true;

        if (typeof workdir === 'function') {
            fn = workdir
        } else if (typeof workdir === 'string') {
            node.setAttribute('nwworkingdir', workdir);
        }

        this._context.body.appendChild(node);
        node.addEventListener('change', function() {
            fn(node.value);
            node.remove();
        });
        node.click();
    },

    isArray: function(value) {
      return Object.prototype.toString.call(value) === '[object Array]';
    }

}

if (typeof nw !== 'undefined') {
    if (typeof exports == 'undefined') {
        nw.Dialog = nwdialog;
        window.dialog = nwdialog;
    } else {
        module.exports = nwdialog;
    }
}
