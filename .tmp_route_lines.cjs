const fs = require('fs');
const src = fs.readFileSync('server/src/index.ts','utf8');
const routeRe = /app\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]/g;
const routes=[];
function lineOf(idx){return src.slice(0,idx).split('\n').length;}
let m;
while((m=routeRe.exec(src))!==null){routes.push({method:m[1].toUpperCase(), path:m[2], idx:m.index, line:lineOf(m.index)})}
for(let i=0;i<routes.length;i++){
 const start=routes[i].idx; const end=i+1<routes.length?routes[i+1].idx:src.length; const block=src.slice(start,end);
 routes[i].requireAuth=/requireAuth\(/.test(block);
 routes[i].authorizeCompany=/authorizeCompany\(/.test(block);
 routes[i].authorizeOwnedResource=/authorizeOwnedResource\(/.test(block);
 routes[i].companyInput=[
  /params as \{ companyId: string \}/.test(block) ? 'path:companyId' : null,
  /body\.companyId/.test(block) ? 'body:companyId' : null,
  /body\.company_id/.test(block) ? 'body:company_id' : null,
  /request\.query as \{ companyId\?: string \}/.test(block) ? 'query:companyId' : null,
  /body\?\.company_id/.test(block) ? 'body?:company_id' : null,
  /body\?\.companyId/.test(block) ? 'body?:companyId' : null,
 ].filter(Boolean);
}
function print(title, arr){
 console.log(`\n## ${title} (${arr.length})`);
 for(const r of arr){
  console.log(`${r.line}\t${r.method} ${r.path}${r.companyInput.length?`\t[${r.companyInput.join(',')}]`:''}`)
 }
}
print('requireAuth only', routes.filter(r=>r.requireAuth && !r.authorizeCompany && !r.authorizeOwnedResource));
print('authorizeCompany', routes.filter(r=>r.authorizeCompany));
print('authorizeOwnedResource', routes.filter(r=>r.authorizeOwnedResource));
print('company_id from params/body/query', routes.filter(r=>r.companyInput.length>0));
