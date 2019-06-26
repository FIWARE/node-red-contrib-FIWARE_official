/**
 *
 *   NGSI Utils file
 *
 *   Copyright (c) 2019 FIWARE Foundation e.V.
 *
 *   @author José Manuel Cantera Fonseca
 *
 *
 */

/**
 *
 *  Transforms an NGSIv2 subscription into an NGSI-LD Subscription
 *
 * @param v2Subscription
 */
function ldSubscription(v2Subscription, ldContext, mimeType) {
  const out = {
    type: 'Subscription',
    '@context': ldContext
  };

  out.entities = [];

  const subject = v2Subscription.subject;
  const notification = v2Subscription.notification;

  if (
    !subject ||
    !notification ||
    !subject.entities ||
    !Array.isArray(subject.entities) ||
    !notification.http
  ) {
    throw new Error('Bad subscription');
  }

  subject.entities.forEach(entity => {
    const entityData = JSON.parse(JSON.stringify(entity));

    out.entities.push(entityData);
    if (entityData.type && entityData.idPattern === '.*') {
      delete entityData.idPattern;
    }
  });

  if (subject.condition && typeof subject.condition === 'object') {
    const attrs = subject.condition.attrs;
    if (attrs && Array.isArray(attrs) && attrs.length > 0) {
      out.watchedAttributes = attrs;
    }

    if (
      subject.condition.expression &&
      typeof subject.condition.expression === 'object' &&
      subject.condition.expression.q
    ) {
      out.q = subject.condition.expression.q;
    }
  }

  // Now dealing with notification
  out.notification = Object.create(null);
  const outNotification = out.notification;

  outNotification.endpoint = Object.create(null);
  outNotification.endpoint.uri = notification.http.url;
  outNotification.endpoint.accept = mimeType;

  if (notification.attrsFormat) {
    outNotification.format = notification.attrsFormat;
  }

  if (notification.attrs && Array.isArray(notification.attrs)) {
    outNotification.attributes = notification.attrs;
  }

  return out;
}

module.exports = {
  ldSubscription
};
