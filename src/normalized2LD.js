const URI = require('uri-js');

const LD_CONTEXT = 'https://schema.lab.fiware.org/ld/context';
const ETSI_CORE_CONTEXT =
  'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld';

function ngsildUri(typePart, idPart) {
  return `urn:ngsi-ld:${typePart}:${idPart}`;
}

function ldId(entityId, entityType) {
  let out = entityId;

  try {
    const d = URI.parse(entityId);
    const scheme = d.scheme;
    if (scheme !== 'urn' && scheme !== 'http' && scheme !== 'https') {
      throw new Error('Unknown Scheme Error');
    }
  } catch (e) {
    out = ngsildUri(entityType, entityId);
  }

  return out;
}

function ldObject(attributeName, entityId) {
  let out = entityId;

  try {
    const d = URI.parse(entityId);
    const scheme = d.scheme;
    if (scheme !== 'urn' && scheme !== 'http' && scheme !== 'https') {
      throw new Error('Unknown Scheme Error');
    }
  } catch (e) {
    let entityType = '';
    if (attributeName.startsWith('ref')) {
      entityType = attributeName.slice(3);
    }

    out = ngsildUri(entityType, entityId);
  }

  return out;
}

function v2ToLD(entity) {
  const out = {
    '@context': [ETSI_CORE_CONTEXT, LD_CONTEXT]
  };

  for (const key in entity) {
    if (key === 'id') {
      out[key] = ldId(entity.id, entity.type);
      continue;
    }

    if (key === 'type') {
      out[key] = entity[key];
      continue;
    }

    if (key === 'dateCreated') {
      out.createdAt = normalizeDate(entity[key].value);
      continue;
    }

    if (key === 'dateModified') {
      out.modifiedAt = normalizeDate(entity[key].value);
      continue;
    }

    const attr = entity[key];
    out[key] = {};
    const ldAttr = out[key];

    if (
      !Object.prototype.hasOwnProperty.call(attr, 'type') ||
      attr.type !== 'Relationship'
    ) {
      ldAttr.type = 'Property';
      ldAttr.value = attr.value;
    } else {
      ldAttr.type = 'Relationship';
      const auxObj = attr.value;
      if (Array.isArray(auxObj)) {
        ldAttr.object = [];

        for (const obj in auxObj) {
          ldAttr.object.push(ldObject(key, auxObj[obj]));
        }
      } else {
        ldAttr.object = ldObject(key, String(auxObj));
      }
    }

    if (key === 'location') {
      ldAttr.type = 'GeoProperty';
    }

    if (
      Object.prototype.hasOwnProperty.call(attr, 'type') &&
      attr.type === 'DateTime'
    ) {
      ldAttr.value = {
        '@type': 'DateTime',
        '@value': normalizeDate(attr.value)
      };
    }

    if (
      Object.prototype.hasOwnProperty.call(attr, 'type') &&
      attr.type === 'PostalAddress'
    ) {
      ldAttr.value.type = 'PostalAddress';
    }

    if (Object.prototype.hasOwnProperty.call(attr, 'metadata')) {
      const metadata = attr.metadata;
      for (const mkey in metadata) {
        if (mkey === 'timestamp') {
          ldAttr.observedAt = normalizeDate(metadata[mkey].value);
        } else if (mkey === 'unitCode') {
          ldAttr.unitCode = metadata[mkey].value;
        } else {
          const subAttr = {};
          subAttr.type = 'Property';
          subAttr.value = metadata[mkey].value;
          ldAttr[mkey] = subAttr;
        }
      }
    }
  }

  return out;
}

function normalizeDate(dateStr) {
  let out = dateStr;
  if (!dateStr.endsWith('Z')) {
    out += 'Z';
  }

  return out;
}

module.exports = {
  v2ToLD
};
