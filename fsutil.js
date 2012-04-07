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
        if (!pth.existsSync(base)) {
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

var cp = function(src, dst, callback) {
    var is = fs.createReadStream(src);
    var os = fs.createWriteStream(dst);
    util.pump(is, os, callback);
}

var cp_r = function(src, dst, callback) {
    var self = this;

    if (fs.statSync(src).isDirectory()) {
        fs.mkdirSync(dst);
        var files = fs.readdirSync(src);
        var num_of_files = files.length;
        if (num_of_files == 0) {
            callback(null);
        }
        var cnt = 0;
        var cb = function(err) {
            if (err) throw err;
            if (++cnt >= num_of_files) {
                callback(err);
            }
        }
        files.forEach(function (filename) {
            self.cp_r(pth.join(src, filename), pth.join(dst, filename), cb);
        });
    } else {
        cp(src, dst, callback);
    }
}

var ln_sf = function(src, path) {
    if (pth.existsSync(path)) {
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
