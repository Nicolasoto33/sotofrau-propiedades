// Local test double only. Never shipped with the administration panel.
class LocalBackend {
  constructor() { this.options = {}; }
  isGitBackend() { return false; }
  status() { return Promise.resolve({auth:{status:true},api:{status:true}}); }
  authComponent() { return createClass({render(){ return h('button',{onClick:()=>this.props.onLogin({name:'Local test'})},'Login test'); }}); }
  authenticate() { return Promise.resolve({name:'Local test'}); }
  restoreUser() { return this.authenticate(); }
  logout() {}
  getToken() { return Promise.resolve(''); }
  entriesByFolder() { return Promise.resolve(window.testEntries || []); }
  entriesByFiles() { return Promise.resolve([]); }
  getEntry(path) { return Promise.resolve((window.testEntries || []).find(e=>e.file.path===path)); }
  unpublishedEntries() { return Promise.resolve([]); }
  getMedia() { return Promise.resolve([]); }
  getMediaFile(path) { return Promise.resolve({path,url:'/' + path,displayURL:'/' + path}); }
  getDeployPreview() { return Promise.resolve(null); }
  async persistEntry(entry,options) { window.savedEntry = {data:entry.dataFiles,assets:entry.assets.map(a=>({path:a.path,fileSize:a.fileObj.size})),options}; window.testEntries=entry.dataFiles.map(f=>({data:f.raw,file:{path:f.path,id:f.path}})); }
  async unpublishedEntry() { const e=Error('No draft');e.name='EDITORIAL_WORKFLOW_ERROR';e.notUnderEditorialWorkflow=true;throw e; }
}
CMS.registerBackend('test', LocalBackend);
