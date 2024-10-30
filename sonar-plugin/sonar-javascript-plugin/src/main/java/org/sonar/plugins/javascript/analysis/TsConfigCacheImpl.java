package org.sonar.plugins.javascript.analysis;


import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.sonar.api.batch.fs.InputFile;
import org.sonar.api.scanner.ScannerSide;
import org.sonar.plugins.javascript.JavaScriptFilePredicate;
import org.sonar.plugins.javascript.bridge.BridgeServer;
import org.sonar.plugins.javascript.bridge.TsConfigFile;
import org.sonarsource.api.sonarlint.SonarLintSide;
import org.sonarsource.sonarlint.plugin.api.module.file.ModuleFileEvent;
import org.sonarsource.sonarlint.plugin.api.module.file.ModuleFileListener;

@ScannerSide
@SonarLintSide(lifespan = SonarLintSide.MODULE)
public class TsConfigCacheImpl implements TsConfigCache, ModuleFileListener {
  private static final Logger LOG = LoggerFactory.getLogger(TsConfigCacheImpl.class);

  BridgeServer bridgeServer;
  TsConfigOrigin origin;

  Map<TsConfigOrigin, Cache> cacheMap = new EnumMap<>(TsConfigOrigin.class);

  TsConfigCacheImpl(BridgeServer bridgeServer) {
    this.bridgeServer = bridgeServer;
    cacheMap.put(TsConfigOrigin.PROPERTY, new Cache());
    cacheMap.put(TsConfigOrigin.LOOKUP, new Cache());
    cacheMap.put(TsConfigOrigin.FALLBACK, new Cache());
  }

  class Cache {
    Map<String, TsConfigFile> inputFileToTsConfigFilesMap = new HashMap<>();
    Set<String> discoveredTsConfigFiles = new HashSet<>();
    List<String> originalTsConfigFiles = new ArrayList<>();
    Deque<String> pendingTsConfigFiles = new ArrayDeque<>();
    boolean initialized = false;

    TsConfigFile getTsConfigForInputFile(InputFile inputFile) {
      var inputFilePath = inputFile.absolutePath();
      if (!initialized) {
        LOG.error("TsConfigCacheImpl is not initialized for file {}", inputFilePath);
        return null;
      }
      if (inputFileToTsConfigFilesMap.containsKey(inputFilePath)) {
        return inputFileToTsConfigFilesMap.get(inputFilePath);
      }

      pendingTsConfigFiles = improvedPendingTsConfigOrder(inputFile);

      LOG.debug("Continuing BFS for file: {}, pending order: {}", inputFilePath, pendingTsConfigFiles);
      while (!pendingTsConfigFiles.isEmpty()) {
        var tsConfigPath = pendingTsConfigFiles.pop();
        LOG.debug("Computing tsconfig {} from bridge", tsConfigPath);
        TsConfigFile tsConfigFile = bridgeServer.loadTsConfig(tsConfigPath);
        tsConfigFile.getFiles().forEach(file -> inputFileToTsConfigFilesMap.putIfAbsent(file, tsConfigFile));
        if (!tsConfigFile.getProjectReferences().isEmpty()) {
          LOG.info("Adding referenced project's tsconfigs {}", tsConfigFile.getProjectReferences());
          tsConfigFile.getProjectReferences().stream().filter(refPath -> !discoveredTsConfigFiles.contains(refPath)).forEach(refPath -> {
            discoveredTsConfigFiles.add(refPath);
            pendingTsConfigFiles.addFirst(refPath);
          });
        }
        if (inputFileToTsConfigFilesMap.containsKey(inputFilePath)) {
          var foundTsConfigFile = inputFileToTsConfigFilesMap.get(inputFilePath);
          LOG.info(
            "Using tsConfig {} for file source file {} ({}/{} tsconfigs not yet checked)",
            foundTsConfigFile.getFilename(),
            inputFilePath,
            pendingTsConfigFiles.size(),
            discoveredTsConfigFiles.size()
          );
          return inputFileToTsConfigFilesMap.get(inputFilePath);
        }
      }
      inputFileToTsConfigFilesMap.put(inputFilePath, null);
      return null;
    }

    void initializeOriginalTsConfigs(List<String> tsconfigs) {
      initialized = true;
      originalTsConfigFiles = tsconfigs;
      clearFileToTsConfigCache();
    }

    void clearAll() {
      initialized = false;
      originalTsConfigFiles = new ArrayList<>();
      clearFileToTsConfigCache();
    }

    void clearFileToTsConfigCache() {
      inputFileToTsConfigFilesMap.clear();
      discoveredTsConfigFiles = new HashSet<>(originalTsConfigFiles);
      pendingTsConfigFiles = new ArrayDeque<>(originalTsConfigFiles);
    }

    /**
     * Compute an improved order of the pending tsconfig files with respect to the given inputFile.
     * This is based on the assumption that a tsconfig *should be* in some parent folder of the inputFile.
     * As an example, for a file in "/usr/path1/path2/index.js", we would identify look for tsconfig's in the exact
     * folders * "/", "/usr/", "/usr/path1/", "/usr/path1/path2/" and move them to the front.
     * Note: This will not change the order between the identified and non-identified tsconfigs.
     * Time and space complexity: O(n).
     *
     * @param inputFile current file to analyze
     * @return Reordered queue of tsconfig files
     */
    private Deque<String> improvedPendingTsConfigOrder(InputFile inputFile) {
      var newPendingTsConfigFiles = new ArrayDeque<String>();
      var notMatchingPendingTsConfigFiles = new ArrayList<String>();
      pendingTsConfigFiles.forEach(ts -> {
        if (inputFile.absolutePath().startsWith(Path.of(ts).getParent().toAbsolutePath().toString())) {
          newPendingTsConfigFiles.add(ts);
        } else {
          notMatchingPendingTsConfigFiles.add(ts);
        }
      });
      newPendingTsConfigFiles.addAll(notMatchingPendingTsConfigFiles);
      return newPendingTsConfigFiles;
    }
  }

  public TsConfigFile getTsConfigForInputFile(InputFile inputFile) {
    if (origin == null) {
      return null;
    }
    return cacheMap.get(origin).getTsConfigForInputFile(inputFile);
  }

  public @Nullable List<String> listCachedTsConfigs(TsConfigOrigin tsConfigOrigin) {
    var currentCache = cacheMap.get(tsConfigOrigin);

    if (currentCache.initialized) {
      LOG.debug("TsConfigCache is already initialized");
      return currentCache.originalTsConfigFiles;
    }
    return null;
  }

  public void setOrigin(TsConfigOrigin tsConfigOrigin) {
    origin = tsConfigOrigin;
  }

  public void initializeWith(List<String> tsConfigPaths, TsConfigOrigin tsConfigOrigin) {
    var cache = cacheMap.get(tsConfigOrigin);
    if (tsConfigOrigin == TsConfigOrigin.FALLBACK && cache.initialized) {
      return;
    }
    if (tsConfigOrigin != TsConfigOrigin.FALLBACK && cache.originalTsConfigFiles.equals(tsConfigPaths)) {
      return;
    }

    LOG.debug("Resetting the TsConfigCache {}", tsConfigOrigin);
    cache.initializeOriginalTsConfigs(tsConfigPaths);
  }

  @Override
  public void process(ModuleFileEvent moduleFileEvent) {
    var file = moduleFileEvent.getTarget();
    var filename = file.absolutePath();
    LOG.debug("Processing file event {} with event {}", filename, moduleFileEvent.getType());
    // Look for any event on files named *tsconfig*.json
    // Filenames other than tsconfig.json can be discovered through references
    if (filename.endsWith("json") && file.filename().contains("tsconfig")) {
      LOG.debug("Clearing tsconfig cache");
      cacheMap.get(TsConfigOrigin.LOOKUP).clearAll();
      if (cacheMap.get(TsConfigOrigin.PROPERTY).discoveredTsConfigFiles.contains(filename)) {
        cacheMap.get(TsConfigOrigin.PROPERTY).clearAll();
      }
    } else if (moduleFileEvent.getType() == ModuleFileEvent.Type.CREATED && (JavaScriptFilePredicate.isJavaScriptFile(file) || JavaScriptFilePredicate.isTypeScriptFile(file))) {
      // The file to tsconfig cache is cleared, as potentially the tsconfig file that would cover this new file
      // has already been processed, and we would not be aware of it. By clearing the cache, we guarantee correctness.
      LOG.debug("Clearing input file to tsconfig cache");
      cacheMap.values().forEach(Cache::clearFileToTsConfigCache);
    }
  }
}