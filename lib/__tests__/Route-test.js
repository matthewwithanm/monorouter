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
      expect(route.url).toThrowError(/Could not reverse URL/);
    });

  });
});
