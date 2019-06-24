/**
 *
 *   NGSI Transformer Node
 *
 *   It transforms a NGSI(v2,LD) entity to the other NGSI(v2,LD) format.
 *   E.g. v2 --> LD || LD --> v2
 *
 *   Copyright (c) 2019 Alexandra Instituttet A/S
 *
 *   @author Bjarke Hou Kammersgaard
 *
 */

const URI = require("uri-js");

const LD_CONTEXT = 'https://schema.lab.fiware.org/ld/context';
const ETSI_CORE_CONTEXT = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld';

function ngsildUri(typePart, idPart) {
  return 'urn:ngsi-ld:'+typePart+':'+idPart;
}

function ldId(entityId, entityType) {
  let out = entityId;

  try {
    const d = URI.parse(entityId);
    const scheme = d.scheme;
    if(scheme !== 'urn' && scheme !== 'http' && scheme !== 'https') {
      throw new Error("Unknown Scheme Error");
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
    if(scheme !== 'urn' && scheme !== 'http' && scheme !== 'https') {
      throw new Error("Unknown Scheme Error");
    }
  } catch (e) {
    let entityType = '';
    if(attributeName.startsWith('ref')) {
      entityType = attributeName.slice(3);
    }

    out = ngsildUri(entityType, entityId);
  }

  return out;
}

function ldToV2(entity) {
  // WIP
  return null;
}

function v2ToLD(entity, node) {
  let out = {
    '@context': [ETSI_CORE_CONTEXT, LD_CONTEXT]
  }

  for(let key in entity) {

    if(key === 'id') {
      out[key] = ldId(entity.id, entity.type);
      continue;
    }

    if(key === 'type') {
      out[key] = entity[key];
      continue;
    }

    if(key === 'dateCreated') {
      out.createdAt = normalizeDate(entity[key].value);
      continue;
    }

    const attr = entity[key];
    out[key] = {};
    let ldAttr = out[key];

    if(!Object.prototype.hasOwnProperty.call(attr, 'type') || attr.type !== 'Relationship') {
      ldAttr.type = 'Property';
      ldAttr.value = attr.value;
    } else {
      ldAttr.type = 'Relationship';
      const auxObj = attr.value;
      if(Array.isArray(auxObj)) {
        ldAttr.object = [];

        for(let obj in auxObj) {
          ldAttr.object.append(ldObject(key, obj));
        }
      } else {
        ldAttr.object = ldObject(key, String(auxObj));
      }
    }

    if(key === 'location') {
      ldAttr.type = 'GeoProperty';
    }

    if(Object.prototype.hasOwnProperty.call(attr, 'type') && attr.type === 'DateTime') {
      ldAttr.value = {
        '@type': 'DateTime',
        '@value': normalizeDate(attr.value)
      }
    }

    if(Object.prototype.hasOwnProperty.call(attr, 'type') && attr.type === 'PostalAddress') {
      ldAttr.value.type = 'PostalAddress';
    }

    if(Object.prototype.hasOwnProperty.call(attr, 'metadata')) {
      const metadata = attr.metadata;
      for(let mkey in metadata) {
        if(mkey === 'timestamp') {
          ldAttr.observedAt = normalizeDate(metadata[mkey].value);
        } else if(mkey === 'unitCode') {
          ldAttr.unitCode = metadata[mkey].value;
        } else {
          let subAttr = {};
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
  if(!dateStr.endsWith('Z')) {
    out += "Z";
  }

  return out;
}

module.exports = function(RED) {
  function NgsiTransformerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', function(msg) {

      if(!msg.payload) {
        node.error('No payload provided');
      }

      // Validate JSON format
      let entity = msg.payload;

      if(typeof msg.payload === 'string') {
        try {
          entity = JSON.parse(msg.payload);
        } catch (SyntaxError) {
          node.error('Input was not valid');
        }
      }

      // Transform
      let transformedEntity = null;
      if(config.transformMode === 'v2ToLD') {
        transformedEntity = v2ToLD(entity, node);
      } else if(config.transformMode === 'ldToV2') {
        transformedEntity = ldToV2(msg.payload);
      }

      // Send
      msg.payload = transformedEntity;
      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSI-Transformer', NgsiTransformerNode);
};
