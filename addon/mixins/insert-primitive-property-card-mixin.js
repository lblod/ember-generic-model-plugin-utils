import Mixin from '@ember/object/mixin';
import CardMixin from './card-mixin';
import {
  attributePropertyToRdfa,
  relationPropertyToRdfaReference
} from '../utils/json-api-to-rdfa';

export default Mixin.create(CardMixin, {
  async insert(propertyMeta, value, content, hintOwner, extraInfo = []){
    let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
    this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), hintOwner);
    this.get('editor').replaceTextWithHTML(...mappedLocation, attributePropertyToRdfa(propertyMeta, value, content), extraInfo);
  }
});
