import Mixin from '@ember/object/mixin';
import CardMixin from './card-mixin';
import {
  attributePropertyToRdfa,
} from '../utils/json-api-to-rdfa';

export default Mixin.create(CardMixin, {
  getRdfa(propertyMeta, value, content){
    return attributePropertyToRdfa(propertyMeta, value, content);
  }
});
