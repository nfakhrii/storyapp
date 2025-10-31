function extractPathnameSegments(path) {
  const splitUrl = path.split('/');

  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = '';

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }

  if (pathSegments.id) {
    pathname = pathname.concat('/:id');
  }

  return pathname || '/';
}

export function getActivePathname() {
  return location.hash.replace('#', '') || '/';
}

export function getActiveRoute() {
  const pathname = getActivePathname();
  const urlSegments = extractPathnameSegments(pathname);
  const constructed = constructRouteFromSegments(urlSegments);

  return constructed || '/';
}

export function parseActivePathname() {
  return extractPathnameSegments(getActivePathname());
}

export function getRoute(pathname) {
  return constructRouteFromSegments(extractPathnameSegments(pathname));
}

export function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}
