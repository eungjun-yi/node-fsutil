var fs = require('fs');
var pth = require('path');
var util = require('util');

pth.sep = pth.sep || (process.platform == 'win32' ? '\\' : '/');

var rm_rf = function(path) {
    try {
        var stat = fs.lstatSync(path);
    } catch(e) {
        return false;
    }

    if (stat.isDirectory()) {
        fs.readdirSync(path).forEach(function (filename) {
            rm_rf(pth.join(path, filename));
        });
        fs.rmdirSync(path);
    } else {
        fs.unlinkSync(path);
    }
}

var _mkdir_p = function(path_segments) {
    var base = '';
    var paths_to_create = [];
    if (!path_segments.every(function (segment) {
        base = pth.join(base, segment);
        if (!fs.existsSync(base)) {
            paths_to_create.push(base);
            return true;
        }
        return fs.statSync(base).isDirectory();
    })) {
        return false;
    }

    paths_to_create.forEach(function (segment) { 
        fs.mkdirSync(segment); 
    });

}

var mkdir_p = function(path) {
    return _mkdir_p(pth.normalize(path).split(pth.sep));
}

var fwrite_p = function(path, data) {
    var path_segments = pth.normalize(path).split(pth.sep);
    _mkdir_p(path_segments.slice(0, path_segments.length - 1));
    return fs.writeFileSync(path, data);
}

var cp = function(src, dst) {
    var block_size = 4096;
    var buf = new Buffer(block_size);
    var fd_src = fs.openSync(src, 'r');
    var fd_dst = fs.openSync(dst, 'w');
    var offset = 0;
    var remain = fs.statSync(src).size;
    var read_size = 0;

    while (remain) {
        read_size = remain < block_size ? remain : block_size;
        fs.readSync(fd_src, buf, offset, read_size);
        fs.writeSync(fd_dst, buf, offset, read_size);
        remain -= read_size;
        offset += read_size;
    }

    fs.closeSync(fd_src);
    fs.closeSync(fd_dst);
}

var cp_r = function(src, dst) {
    var self = this;

    if (fs.statSync(src).isDirectory()) {
        fs.mkdirSync(dst);
        var files = fs.readdirSync(src);
        files.forEach(function (filename) {
            self.cp_r(pth.join(src, filename), pth.join(dst, filename));
        });
    } else {
        cp(src, dst);
    }
}

var ln_sf = function(src, path) {
    if (fs.existsSync(path)) {
        if (fs.statSync(path).isDirectory()) {
            var segments = src.split(pth.sep);
            filename = segments.split(pth.sep)[segments.length - 1]
            fs.symlinkSync(src, pth.join(path, filename));
        } else {
            fs.unlinkSync(path);
            fs.symlinkSync(src, path);
        }
    } else {
        fs.symlinkSync(src, path);
    }
}

var chown_R = function(uid, gid, path) {
    var self = this;

    if (fs.statSync(path).isDirectory()) {
        var files = fs.readdirSync(path);
        files.forEach(function (filename) {
            self.chown_R(uid, gid, pth.join(path, filename));
        });
        fs.chownSync(path, uid, gid);
    } else {
        fs.chownSync(path, uid, gid);
    }
}

exports.rm_rf = rm_rf;
exports.mkdir_p = mkdir_p;
exports.fwrite_p = fwrite_p;
exports.cp = cp;
exports.cp_r = cp_r;
exports.ln_s = fs.symlinkSync;
exports.ln_sf = ln_sf;
exports.cd = process.chdir;
exports.pwd = process.cwd;
exports.mv = fs.renameSync;
exports.rm = fs.unlinkSync;
exports.chmod = function(mode, path) { return fs.chmodSync(path, mode); };
exports.chown = function(uid, gid, path) { return fs.chownSync(path, uid, gid); };
exports.chown_R = chown_R;
