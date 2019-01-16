package de.hszemi.votemanager;

import net.cgro.votemanager.model.Wahl;
import net.cgro.votemanager.util.ErrorCollector;
import net.cgro.votemanager.util.WahlMergeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.bind.JAXB;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static spark.Spark.*;

public class Manager {

    private static Logger log = LoggerFactory.getLogger(Manager.class);
    private static Set<String> pinkHosts = new LinkedHashSet<>();
    private static Set<String> yellowHosts = new LinkedHashSet<>();

    public static void main(String[] args) {
        port(8080);
        staticFiles.location("/app");
        post("/addPinkHost", ((request, response) -> {
            String hostname = request.body();
            log.info("Adding pink host '{}'", hostname);
            pinkHosts.add(hostname);
            return String.join(",", pinkHosts);
        }));
        post("/addYellowHost", ((request, response) -> {
            String hostname = request.body();
            log.info("Adding yellow host '{}'", hostname);
            yellowHosts.add(hostname);
            return String.join(",", yellowHosts);
        }));

        get("/pinkWahl", ((request, response) -> {
            response.type("text/xml; charset=utf-8");
            StringWriter stringWriter = new StringWriter();
            try {
                JAXB.marshal(getPinkWahl(), stringWriter);
                return stringWriter.toString();
            } catch (WahlMergeException e) {
                return e.getMessage();
            }
        }));
        get("/yellowWahl", ((request, response) -> {
            response.type("text/xml; charset=utf-8");
            StringWriter stringWriter = new StringWriter();
            try {
                JAXB.marshal(getYellowWahl(), stringWriter);
                return stringWriter.toString();
            } catch (WahlMergeException e) {
                return e.getMessage();
            }
        }));
    }

    private static Wahl getYellowWahl() throws WahlMergeException {
        return getMergedWahl(yellowHosts);
    }

    private static Wahl getPinkWahl() throws WahlMergeException {
        return getMergedWahl(pinkHosts);
    }

    private static Wahl getMergedWahl(Set<String> hosts) throws WahlMergeException {
        Wahl wahl = null;
        ErrorCollector errorCollector = new ErrorCollector();
        for (String host : hosts) {
            try {
                Wahl other = JAXB.unmarshal(new URL("http", host, 4567, "/status"), Wahl.class);
                if(wahl == null){
                    wahl = other;
                } else {
                    wahl.merge(other);
                }
            } catch (MalformedURLException e) {
                errorCollector.addError("Could not query host '" + host + "': " + e.getMessage());
            } catch (WahlMergeException e) {
                errorCollector.addError("Could not merge Wahl from host '" + host + "': " + e.getMessage());
            }
        }
        errorCollector.throwIfHasErrors();
        return wahl;
    }

    private static Wahl createEmptyWahl() {
        return JAXB.unmarshal(new ByteArrayInputStream("<wahl/>".getBytes(StandardCharsets.UTF_8)), Wahl.class);
    }
}
