import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import CardMixin from './card-mixin';
import {
  formatClassDisplay,
  parseJSONAPIResults,
  extendedRdfa,
  relationPropertyToRdfaReference
} from '../utils/json-api-to-rdfa';

/**
 * mixin contains helpers and service to help serialize to RDFA
 */
export default Mixin.create(CardMixin, {
  ajax: service(),

  async getReferRdfa(relationMeta, JSONAPIResource, displayLabel){
    return relationPropertyToRdfaReference(relationMeta,
                                           await relationMeta.get('range'),
                                           JSONAPIResource,
                                           displayLabel);
  },

  async getExtendedRdfa(relationMeta, JSONAPIResource,){
    let classMetaData = await this.rdfsClassForJsonApiType(JSONAPIResource.data.type);
    let rdfa = await extendedRdfa(query => { return this.ajax.request(query); }, JSONAPIResource, classMetaData, relationMeta.rdfaType);
    return rdfa;
  }

});
