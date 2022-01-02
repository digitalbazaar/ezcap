# @digitalbazaar/ezcap Changelog

## 2.0.0 - 2022-01-xx

### Added
- Allow `expires` to be a `Date` instance.

### Changed
- **BREAKING**: Use zcapld@6.
- **BREAKING**: Use `urn:uuid:` by default for delegated zcaps.

### Removed
- **BREAKING**: Remove `url` parameter from `delegate()` to reduce confusion
  over usage. Now `capability` and / or `invocationTarget` must be specified.

## 1.0.0 - 2021-07-22

### Added
- Initial release, see individual commits for history.
