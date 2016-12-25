// Generated by CoffeeScript 1.11.1
(function() {
  var FS_CODE, VS_CODE, canvas, glw;

  VS_CODE = 'uniform mat4 u_mvpMat;      // MVP矩阵（模型空间=>设备空间）\nuniform mat4 u_mvMat;       // MV矩阵（模型空间=>世界空间）\n\nattribute vec3 a_objPosM;   // 模型位置（模型空间）\nattribute vec3 a_objNormM;  // 模型法线（模型空间）\n\nvarying vec3 v_objPosW;     // 模型位置（世界空间）\nvarying vec3 v_objNormW;    // 模型法线（世界空间）\n\nvoid main() {\n  gl_Position = u_mvpMat * vec4(a_objPosM, 1.0);\n  v_objPosW = (u_mvMat * vec4(a_objPosM, 1.0)).xyz;\n  v_objNormW = a_objNormM;\n}';

  FS_CODE = 'precision mediump float;\n\nconst float C_0 = 0.0;\nconst float C_1 = 1.0;\nconst float C_PI = 3.141592653589793;\nconst float C_2xPI = 2.0 * C_PI;\nconst float C_1_PI = 1.0 / C_PI;\nconst float C_EPSILON = 1e-6;\n\nfloat saturate(const in float a) { return clamp(a, C_0, C_1); }\nvec2 saturate(const in vec2 a) { return clamp(a, C_0, C_1); }\nvec3 saturate(const in vec3 a) { return clamp(a, C_0, C_1); }\nvec4 saturate(const in vec4 a) { return clamp(a, C_0, C_1); }\n\nfloat pow2(const in float a) { return a * a; }\nfloat pow3(const in float a) { return a * a * a; }\nfloat pow4(const in float a) { float b = a * a; return b * b; }\n\nuniform vec3 u_envCol;        // 环境光颜色\n\nuniform vec3 u_paraDirW;      // 平行光源方向\nuniform vec3 u_paraCol;       // 平行光源颜色\n\nuniform vec3 u_viewPosW;      // 摄像机位置（世界空间）\n\nuniform vec3 u_objAlbedo;     // 物体反照率（颜色）\nuniform float u_objMetalness; // 物体金属度\nuniform float u_objRoughness; // 物体粗糙度\n\nvarying vec3 v_objPosW;       // 模型位置（世界空间）\nvarying vec3 v_objNormW;      // 模型法线（世界空间）\n\n// 计算物体材质的diffuse\nvec3 ComputeDiffuse(\n  const in vec3 objAlbedo,\n  const in float objMetalness\n) {\n  return objAlbedo * (C_1 - objMetalness);\n}\n\n// 计算物体材质的specular\nvec3 ComputeSpecular(\n  const in vec3 objAlbedo,\n  const in float objMetalness\n) {\n  return mix(vec3(0.04), objAlbedo, vec3(objMetalness));\n}\n\n// 光照方程 漫反射项\nvec3 DiffuseTerm(\n  const in vec3 objDiff\n) {\n  return C_1_PI * objDiff;\n}\n\n// BRDF F项 菲涅尔项\nvec3 FresnelTerm(\n  const in float lightDotHalf,\n  const in vec3 objSpec\n) {\n  float fresnel = pow(C_1 - lightDotHalf, 5.0);\n  return objSpec + (C_1 - objSpec) * fresnel;\n}\n\n// BRDF G项 几何项\nfloat GeometryTerm(\n  const in float normDotLightW,\n  const in float normDotViewW,\n  const in float objRoughness\n) {\n  float alphaPow2 = pow4(objRoughness);\n  float gl = normDotLightW + sqrt(alphaPow2 + (C_1 - alphaPow2) * pow2(normDotViewW));\n  float gv = normDotViewW + sqrt(alphaPow2 + (C_1 - alphaPow2) * pow2(normDotLightW));\n  return 0.5 / max(gl + gv, C_EPSILON);\n  //return 0.5 / gl * gv;\n}\n\n// BRDF D项 分布项\nfloat DistributionTerm(\n  const in float normDotHalfW,\n  const in float objRoughness\n) {\n  float alphaPow2 = pow4(objRoughness);\n  float denom = pow2(normDotHalfW) * (alphaPow2 - C_1) + 1.0;\n  return C_1_PI * alphaPow2 / pow2(denom);\n}\n\n// 光照方程 镜面反射项\nvec3 SpecularTerm(\n  const in float normDotLightW,\n  const in float normDotViewW,\n  const in float normDotHalfW,\n  const in float lightDotHalfW,\n  const in vec3 objSpec,\n  const in float objRoughness\n) {\n  vec3 fresnelTerm = FresnelTerm(lightDotHalfW, objSpec);\n  float geometryTerm = GeometryTerm(normDotLightW, normDotViewW, objRoughness);\n  float distributionTerm = DistributionTerm(normDotHalfW, objRoughness);\n  return fresnelTerm * (distributionTerm * geometryTerm);\n}\n\n// 光照方程\nvec3 LightEquation(\n  const in vec3 lightVecW,\n  const in vec3 viewVecW,\n  const in vec3 objNormW,\n  const in vec3 lightCol,\n  const in vec3 objDiff,\n  const in vec3 objSpec,\n  const in float objRoughness\n) {\n  vec3 halfVecW = normalize(lightVecW + viewVecW);\n\n  float normDotLightW = saturate(dot(objNormW, lightVecW));\n  float normDotViewW = saturate(dot(objNormW, viewVecW));\n  float normDotHalfW = saturate(dot(objNormW, halfVecW));\n  float lightDotHalfW = saturate(dot(lightVecW, halfVecW));\n\n  vec3 diffuseTerm = DiffuseTerm(objDiff);\n  vec3 specularTerm = SpecularTerm(\n    normDotLightW, normDotViewW, normDotHalfW, lightDotHalfW,\n    objSpec, objRoughness\n  );\n  return C_PI * (diffuseTerm + specularTerm) * (lightCol * normDotLightW);\n}\n\nvoid main() {\n  vec3 objDiff = ComputeDiffuse(u_objAlbedo, u_objMetalness);\n  vec3 objSpec = ComputeSpecular(u_objAlbedo, u_objMetalness);\n\n  vec3 viewVecW = normalize(u_viewPosW - v_objPosW);\n\n  vec3 envCol = u_objAlbedo * u_envCol;\n\n  vec3 paraLightVecW = -u_paraDirW;\n  vec3 paraCol = LightEquation(\n    paraLightVecW, viewVecW, v_objNormW,\n    u_paraCol, objDiff, objSpec, u_objRoughness\n  );\n\n  gl_FragColor = vec4(envCol + paraCol, 1.0);\n}';

  canvas = document.getElementById("gl-canvas");

  glw = createWebGLWrap(canvas, {
    antialias: true
  });

  Promise.all([glw.createShader(VS_CODE, FS_CODE), glw.createBufferMesh_Obj("../_res/sphere-12.obj")]).then(function(resArray) {
    var animeTick, clearParam, drawParamArray, i, ii, j, jj, lightEnv, mesh, modelMat, moveMat, mvMat, mvpMat, objAlbedo, objMetalness, objRoughness, paraCol, paraDir, projMat, scaleMat, shader, viewPos;
    shader = resArray[0];
    mesh = resArray[1];
    clearParam = {
      clearColorRed: 0.92,
      clearColorGreen: 0.92,
      clearColorBlue: 0.92,
      clearColorAlpha: 1.0,
      clearDepth: 1.0
    };
    lightEnv = vec3.fromValues(0.6, 0.6, 0.6);
    paraDir = vec3.fromValues(-M.SQRT3_3, -M.SQRT3_3, -M.SQRT3_3);
    paraCol = vec3.fromValues(0.7, 0.7, 0.7);
    viewPos = vec3.fromValues(0, 0, 500);
    objAlbedo = vec3.fromValues(159 / 255, 164 / 255, 174 / 255);
    drawParamArray = [];
    for (ii = i = 0; i < 9; ii = ++i) {
      for (jj = j = 0; j < 9; jj = ++j) {
        objMetalness = 0.0 + (ii + 1) / 10;
        objRoughness = 1.0 - (jj + 1) / 10;
        moveMat = mat4.fromTranslation(mat4.create(), [-240 + ii * 60, -240 + jj * 60, 0]);
        scaleMat = mat4.fromScaling(mat4.create(), [22, 22, 22]);
        modelMat = mat4.multiply(mat4.create(), moveMat, scaleMat);
        projMat = mat4.ortho(mat4.create(), -512, 512, -288, 288, -500, 500);
        mvMat = mat4.copy(mat4.create(), modelMat);
        mvpMat = mat4.multiply(mat4.create(), projMat, modelMat);
        drawParamArray.push({
          shader: shader,
          uniformArray: [
            {
              name: "u_mvpMat",
              data: mvpMat
            }, {
              name: "u_mvMat",
              data: mvMat
            }, {
              name: "u_envCol",
              data: lightEnv
            }, {
              name: "u_paraDirW",
              data: paraDir
            }, {
              name: "u_paraCol",
              data: paraCol
            }, {
              name: "u_viewPosW",
              data: viewPos
            }, {
              name: "u_objAlbedo",
              data: objAlbedo
            }, {
              name: "u_objMetalness",
              data: objMetalness
            }, {
              name: "u_objRoughness",
              data: objRoughness
            }
          ],
          attributeArray: [
            {
              name: "a_objPosM",
              size: 3,
              stride: 6,
              offset: 0,
              data: mesh
            }, {
              name: "a_objNormM",
              size: 3,
              stride: 6,
              offset: 3,
              data: mesh
            }
          ],
          drawIndex: mesh,
          drawMode: glw.DrawMode.TRIANGLES,
          drawCount: mesh.getIndexLength()
        });
      }
    }
    animeTick = function() {
      var drawParam, k, len, results;
      glw.clearFrame(clearParam);
      results = [];
      for (k = 0, len = drawParamArray.length; k < len; k++) {
        drawParam = drawParamArray[k];
        results.push(glw.drawCall(drawParam));
      }
      return results;
    };
    return util.updateAnime(animeTick);
  })["catch"](function(err) {
    return console.log(err);
  });

}).call(this);
