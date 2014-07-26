var Route = require('../Route');


describe('Route', function() {
  describe('#url()', function() {

    it('generates a URL', function() {
      var route = new Route('/users/');
      var url = route.url();
      expect(url).toBe('/users/');
    });

    it('generates a URL with a named param', function() {
      var route = new Route('/users/:username/pets');
      var url = route.url({username: 'matthewwithanm'});
      expect(url).toBe('/users/matthewwithanm/pets');
    });

    it("errors if you don't provide all the params", function() {
      var route = new Route('/users/:username/pets');
      expect(route.url.bind(route)).toThrowError(/Missing required param/);
    });

    it("properly builds URLs with special RegExp chars", function() {
      var route = new Route('/weird,^url/:username/pets');
      var url = route.url({username: 'matthewwithanm'});
      expect(url).toBe('/weird,^url/matthewwithanm/pets');
    });

    it("properly builds URLs with optional params", function() {
      var route = new Route('/users/:username?');
      var url = route.url({username: 'matthewwithanm'});
      expect(url).toBe('/users/matthewwithanm');
      expect(route.url()).toBe('/users');
    });

  });
});
