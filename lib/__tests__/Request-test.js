var Request = require('../Request');


describe('Request', function() {

  it('has no hash in the `url` or `originalUrl` properties', function() {
    var req = new Request('http://example.com/a/b/c?search=hi#yup');
    expect(req.url).not.toContain('#');
    expect(req.originalUrl).not.toContain('#');
  });

  it('exposes the hash', function() {
    var req = new Request('http://example.com/a/b/c?search=hi#yup');
    expect(req.fragment).toBe('yup');
  });

  it('contains the domain', function() {
    var req = new Request('http://example.com/a/b/c');
    expect(req.hostname).toBe('example.com');
  });

  it('has the path as its url property', function() {
    var req = new Request('http://example.com/a/b/c?search=hi#yup');
    expect(req.url).toBe('/a/b/c?search=hi');
  });

  it('resolves the url to a root', function() {
    var req = new Request('http://example.com/a/b/c?search=hi#yup',
                          {root: '/a/b'});
    expect(req.url).toBe('/c?search=hi');
  });

  it('resolves the url to a root with a trailing slash', function() {
    var req = new Request('http://example.com/a/b/c?search=hi#yup',
                          {root: '/a/b/'});
    expect(req.url).toBe('/c?search=hi');
  });

  it('contains the original, unresolved url', function() {
    var req = new Request('http://example.com/a/b/c?search=hi#yup',
                          {root: '/a/b/'});
    expect(req.originalUrl).toBe('/a/b/c?search=hi');
  });

  it('has no `url` property when the URL is outside the root', function() {
    var req = new Request('http://example.com/a/b/c?search=hi',
                          {root: '/x/y'});
    expect(req.url).toBe(null);
    expect(req.originalUrl).toBe('/a/b/c?search=hi');
  });

});
