var assert = require('assert');
var fsutil = require('../fsutil');
var fs = require('fs');
var path = require('path');

suite('fsutil.rm_rf', function() {
    setup(function(done) {
        if (fs.existsSync('a')) {
            fs.rmdirSync('a');
        }
        if (fs.existsSync('a/b')) {
            fs.unlinkSync('a/b');
        }
        if (fs.existsSync('b')) {
            fs.rmdirSync('b');
        }
        if (fs.existsSync('c')) {
            fs.unlinkSync('c');
        }
        if (fs.existsSync('d')) {
            fs.unlinkSync('d');
        }
        done();
    });

    test('Remove given directory recursively.', function() {
        fs.mkdirSync('a');
        fs.writeFileSync('a/b', 'hello');
        fsutil.rm_rf('a');
        assert.ok(!fs.existsSync('a'));
        assert.ok(!fs.existsSync('a/b'));
    });

    test('Remove a dead symbolic link.', function() {
        fs.writeFileSync('c', 'hello');
        fs.symlinkSync('c', 'd');
        fs.unlinkSync('c');
        fsutil.rm_rf('d');
        assert.throws(function() {fs.lstatSync('d');});
    });

    teardown(function(done) {
        if (fs.existsSync('a')) {
            fs.rmdirSync('a');
        }
        if (fs.existsSync('a/b')) {
            fs.unlinkSync('a/b');
        }
        if (fs.existsSync('b')) {
            fs.rmdirSync('b');
        }
        if (fs.existsSync('c')) {
            fs.unlinkSync('c');
        }
        if (fs.existsSync('d')) {
            fs.unlinkSync('d');
        }
        done();
    });
});

suite('fsutil.mkdir_p', function() {
    setup(function(done) {
        if (fs.existsSync('a/b')) {
            fs.rmdirSync('a/b');
            fs.rmdirSync('a');
        }
        done();
    });

    test('Create a directory and all its parent directories.', function(done) {
        fsutil.mkdir_p('a/b');
        assert.ok(fs.existsSync('a'));
        assert.ok(fs.existsSync('a/b'));
        done();
    });

    teardown(function(done) {
        if (fs.existsSync('a/b')) {
            fs.rmdirSync('a/b');
            fs.rmdirSync('a');
        }
        done();
    });
});

suite('fsutil.fwrite_p', function() {
    setup(function(done) {
        if (fs.existsSync('a/b')) {
            fs.unlinkSync('a/b');
            fs.rmdirSync('a');
        }
        done();
    });

    test('Write a file after create all its parent directories.', function(done) {
        fsutil.fwrite_p('a/b', 'hello');
        assert.equal(fs.readFileSync('a/b'), 'hello');
        done();
    });

    teardown(function(done) {
        if (fs.existsSync('a/b')) {
            fs.unlinkSync('a/b');
            fs.rmdirSync('a');
        }
        done();
    });
});

suite('fsutil.cp', function() {
    setup(function(done) {
        fsutil.rm_rf('a');
        fsutil.rm_rf('b');
        done();
    });

    test('Copy src to dest', function(done) {
        fs.writeFileSync('a', 'hello');
        fsutil.cp('a', 'b');
        assert.equal(fs.readFileSync('b').toString(), 'hello');
        done();
    });

    teardown(function(done) {
        fsutil.rm_rf('a');
        fsutil.rm_rf('b');
        done();
    });
});

suite('fsutil.cp_r', function() {
    setup(function(done) {
        fsutil.rm_rf('a');
        fsutil.rm_rf('b');
        done();
    });

    test('Copy src to dest recursively.', function(done) {
        fs.mkdirSync('a');
        fs.mkdirSync('a/b');
        fs.mkdirSync('a/c');
        fs.writeFileSync('a/d', 'hello');

        fsutil.cp_r('a', 'b');
        assert.equal(fs.readFileSync('b/d'), 'hello');
        done();
    });

    teardown(function(done) {
        fsutil.rm_rf('a');
        fsutil.rm_rf('b');
        done();
    });
});

suite('fsutil.ln_sf', function() {
    setup(function(done) {
        fsutil.rm_rf('a');
        fsutil.rm_rf('b');
        done();
    });

    test('Creates a symbolic link on the given path even if a file exists on the path.', function(done) {
        fs.writeFileSync('a', 'hello');
        fs.writeFileSync('b', 'bye');
        fsutil.ln_sf('a', 'b');

        assert.ok(fs.lstatSync('b').isSymbolicLink());
        assert.equal(fs.readFileSync('b'), 'hello');
        done();
    });

    teardown(function(done) {
        fsutil.rm_rf('a');
        fsutil.rm_rf('b');
        done();
    });
});

suite('fsutil.cd', function() {
    var origin;

    setup(function(done) {
        fsutil.rm_rf('a');
        origin = process.cwd();
        done();
    });

    test('Change the current working directory.', function(done) {
        fs.mkdirSync('a');
        var last_path = process.cwd();
        fsutil.cd('a');
        assert.equal(process.cwd(), path.join(last_path, 'a'));
        done();
    });

    teardown(function(done) {
        process.chdir(origin);
        fsutil.rm_rf('a');
        done();
    });
});

suite('fsutil.pwd', function() {
    test('Get the current working directory.', function() {
        assert.equal(process.cwd(), fsutil.pwd());
    });
});

// this test must be ran as root.
suite('fsutil.chown_R', function() {
    setup(function(done) {
        fsutil.rm_rf('a');
        done();
    });

    test('Change the owner of given path recursively.', function() {
        fs.mkdirSync('a');
        fs.writeFileSync('a/b', 'hello');
        fsutil.chown_R(1000, 1000, 'a');
        var stat = fs.statSync('a');
        assert.equal(fs.statSync('a').uid, 1000);
        assert.equal(fs.statSync('a').gid, 1000);
        assert.equal(fs.statSync('a/b').uid, 1000);
        assert.equal(fs.statSync('a/b').gid, 1000);
    });

    teardown(function(done) {
        fsutil.rm_rf('a');
        done();
    });
});
