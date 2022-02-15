# @digitalbazaar/ezcap Changelog

## 2.0.2 - 2022-02-15

### Fixed
- Add missing helper function to get delegation proofs.

## 2.0.1 - 2022-01-11

### Changed
- Updated dependencies.

## 2.0.0 - 2022-01-11

### Added
- Allow `expires` to be a `Date` instance.

### Changed
- **BREAKING**: Use zcap@7.
- **BREAKING**: Use `urn:uuid:` by default for delegated zcaps.
- **BREAKING**: Rename `targetDelegate` param to `controller` to match the
  property name that the value will be assigned to in the delegated zcap.

### Removed
- **BREAKING**: Remove `url` parameter from `delegate()` to reduce confusion
  over usage. Now `capability` and / or `invocationTarget` must be specified.
- **BREAKING**: Remove support for capability invocation targets that are
  objects and not strings. This reduces optionality to simplify.

## 1.0.0 - 2021-07-22

### Added
- Initial release, see individual commits for history.
