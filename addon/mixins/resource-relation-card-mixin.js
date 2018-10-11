import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import CardMixin from './card-mixin';
import {
  formatClassDisplay,
  parseJSONAPIResults,
  extendedRdfa,
  relationPropertyToRdfaReference
} from '../utils/json-api-to-rdfa';

export default Mixin.create(CardMixin, {
  ajax: service(),
  async refer(relationMeta, JSONAPIResource, displayLabel, hintOwner, extraInfo = []){
    let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
    this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), hintOwner);
    this.get('editor').replaceTextWithHTML(...mappedLocation,
                                           relationPropertyToRdfaReference(relationMeta,
                                                                           await relationMeta.get('range'),
                                                                           JSONAPIResource,
                                                                           displayLabel),
                                           extraInfo);
  },

  async extend(relationMeta, JSONAPIResource, hintOwner, extraInfo = []){
    let classMetaData = await this.rdfsClassForJsonApiType(JSONAPIResource.data.type);
    let rdfa = await extendedRdfa(query => { return this.ajax.request(query); }, JSONAPIResource, classMetaData, relationMeta.rdfaType);
    let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
    this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), hintOwner);
    this.get('editor').replaceTextWithHTML(...mappedLocation, rdfa, extraInfo);
  }
});
